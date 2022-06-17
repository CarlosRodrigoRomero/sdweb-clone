import { Injectable } from '@angular/core';

import { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Map } from 'ol';

import { OlMapService } from './ol-map.service';
import { FilterService } from './filter.service';
import { ReportControlService } from './report-control.service';
import { ViewReportService } from './view-report.service';

import { LocationAreaInterface } from '@core/models/location';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { FilterableElement } from '@core/models/filterableInterface';

import { COLOR } from '@data/constants/color';
import { Select } from 'ol/interaction';

@Injectable({
  providedIn: 'root',
})
export class ZonesControlService {
  private map: Map;
  zoomChangeView = 18;
  private selectedInformeId: string;
  private toggleViewSelected: number;
  private featureHovered: Feature;
  private prevFeatureHovered: Feature;
  private currentZoom: number;

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private viewReportService: ViewReportService
  ) {}

  initService(): Promise<boolean> {
    return new Promise((initService) => {
      this.olMapService.getMap().subscribe((map) => {
        this.map = map;

        if (this.map !== undefined) {
          initService(true);

          // añadimos acciones sobre las zonas
          this.addOnHoverAction();
          this.addSelectInteraction();
        }
      });

      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));

      this.viewReportService.reportViewSelected$.subscribe((viewSel) => (this.toggleViewSelected = viewSel));

      this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom));
    });
  }

  createZonasLayers(informeId: string): VectorLayer[] {
    const maeLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleMae(false),
      visible: false,
    });
    maeLayer.setProperties({
      informeId,
      view: 0,
      type: 'zonas',
    });
    const ccLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleCelsCalientes(false),
      visible: false,
    });
    ccLayer.setProperties({
      informeId,
      view: 1,
      type: 'zonas',
    });
    const gradLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleGradienteNormMax(false),
      visible: false,
    });
    gradLayer.setProperties({
      informeId,
      view: 2,
      type: 'zonas',
    });

    return [maeLayer, ccLayer, gradLayer];
  }

  mostrarZonas(zonas: LocationAreaInterface[], layers: VectorLayer[]) {
    this.filterService.filteredElements$.subscribe((elems) => {
      this.addZonas(zonas, layers, elems);
    });
  }

  private addZonas(zonas: LocationAreaInterface[], layers: VectorLayer[], elems: FilterableElement[]) {
    // Para cada vector maeLayer (que corresponde a un informe)
    layers.forEach((l) => {
      const view = l.getProperties().view;
      const informeId = l.getProperties().informeId;
      const elemsInforme = this.reportControlService.allFilterableElements.filter(
        (elem) => elem.informeId === informeId
      );
      const elemsFilteredInforme = elems.filter((elem) => elem.informeId === informeId);
      const source = l.getSource();
      source.clear();
      zonas.forEach((zona) => {
        const elemsFilteredZona = this.getElemsZona(zona, elemsFilteredInforme);
        // si no hay seguidores dentro de la zona no la añadimos
        if (elemsFilteredZona.length > 0) {
          const allElemsZona = this.getElemsZona(zona, elemsInforme);
          const property = this.getPropertyView(view, informeId, elemsInforme, allElemsZona);

          const coords = this.pathToLonLat(zona.path);
          // crea poligono seguidor
          const feature = new Feature({
            geometry: new Polygon(coords),
            properties: {
              id: this.getGlobalsLabel(zona.globalCoords),
              informeId,
              centroid: this.olMapService.getCentroid(coords[0]),
              type: 'zone',
              [property.type]: property.value,
            },
          });
          source.addFeature(feature);
        }
      });
    });
  }

  private getPropertyView(
    view: number,
    informeId: string,
    zonasInforme: FilterableElement[],
    elemsZona: FilterableElement[]
  ): any {
    switch (view) {
      case 0:
        let mae = 0;
        // para anomalías enviamos el numero de zonas para calcular el MAE
        if (this.reportControlService.plantaFija) {
          mae = this.getMaeZona(elemsZona, informeId, zonasInforme.length);
        } else {
          mae = this.getMaeZona(elemsZona, informeId);
        }
        return { type: 'mae', value: mae };
      case 1:
        let celsCalientes = 0;
        // para anomalías enviamos el numero de zonas para calcular el CC
        if (this.reportControlService.plantaFija) {
          celsCalientes = this.getCCZona(elemsZona, informeId, zonasInforme.length);
        } else {
          celsCalientes = this.getCCZona(elemsZona, informeId);
        }
        return { type: 'celsCalientes', value: celsCalientes };
      case 2:
        const grad = this.getGradNormMaxZona(elemsZona);
        return { type: 'gradienteNormalizado', value: grad };
    }
  }

  getElemsZona(zona: LocationAreaInterface, elems: FilterableElement[]) {
    const labelZona = this.getGlobalsLabel(zona.globalCoords);

    return elems.filter(
      (elem) => this.getGlobalsLabel(elem.globalCoords, this.reportControlService.plantaFija) === labelZona
    );
  }

  private getMaeZona(elems: FilterableElement[], informeId: string, numZonas?: number): number {
    const informe = this.reportControlService.informes.find((inf) => inf.id === informeId);
    let mae = 0;
    if (numZonas) {
      const anomaliasZona = elems as Anomalia[];
      if (anomaliasZona.length > 0) {
        const perdidas = anomaliasZona.map((anom) => anom.perdidas);
        let perdidasTotales = 0;
        perdidas.forEach((perd) => (perdidasTotales += perd));

        // suponemos zonas iguales para dar un valor aproximado
        mae = perdidasTotales / (informe.numeroModulos / numZonas);
      }
    } else {
      const seguidoresZona = elems as Seguidor[];
      seguidoresZona.forEach((seg) => (mae = mae + seg.mae));
      mae = mae / seguidoresZona.length;
    }

    return mae;
  }

  private getCCZona(elems: FilterableElement[], informeId: string, numZonas?: number): number {
    const informe = this.reportControlService.informes.find((inf) => inf.id === informeId);
    let cc = 0;
    if (numZonas) {
      const anomaliasZona = elems as Anomalia[];
      if (anomaliasZona.length > 0) {
        const celsCalientes = anomaliasZona.filter((anom) => anom.tipo === 8 || anom.tipo === 9);

        // suponemos zonas iguales para dar un valor aproximado
        cc = celsCalientes.length / (informe.numeroModulos / numZonas);
      }
    } else {
      const seguidoresZona = elems as Seguidor[];
      seguidoresZona.forEach((seg) => (cc = cc + seg.celsCalientes));
      cc = cc / seguidoresZona.length;
    }

    return cc;
  }

  private getGradNormMaxZona(elems: FilterableElement[]): number {
    let gradNormMax = 0;
    if (this.reportControlService.plantaFija) {
      const anomaliasZona = elems as Anomalia[];
      if (anomaliasZona.length > 0) {
        const gradientes = anomaliasZona.map((anom) => anom.gradienteNormalizado);

        // devolvemos el gradiente normalizado máximo en la zona
        gradNormMax = Math.max(...gradientes);
      }
    } else {
      const seguidoresZona = elems as Seguidor[];
      const gradientes = seguidoresZona.map((seg) => seg.gradienteNormalizado);

      // devolvemos el gradiente normalizado máximo en la zona
      gradNormMax = Math.max(...gradientes);
    }

    return gradNormMax;
  }

  private addOnHoverAction() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined)
          .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId)
          .filter((item) => item.getProperties().properties.type === 'zone')[0] as Feature;

        if (feature !== undefined) {
          // cuando pasamos de una zona a otra directamente sin pasar por vacio
          if (this.prevFeatureHovered !== undefined) {
            this.prevFeatureHovered.setStyle(this.getStyleZonas(false));
          }

          this.featureHovered = feature;
          this.featureHovered.setStyle(this.getStyleZonas(true));

          this.prevFeatureHovered = feature;
        }
      } else {
        if (this.featureHovered !== undefined) {
          this.featureHovered.setStyle(this.getStyleZonas(false));
        }
      }
    });
  }

  private addSelectInteraction() {
    const select = new Select({
      style: this.getStyleZonas(false),
      layers: (l) => {
        if (
          l.getProperties().informeId === this.selectedInformeId &&
          l.getProperties().view === this.toggleViewSelected &&
          l.getProperties().hasOwnProperty('type') &&
          l.getProperties().type === 'zonas'
        ) {
          return true;
        } else {
          return false;
        }
      },
    });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const centroidZone = e.selected[0].getProperties().properties.centroid;

          this.olMapService.setViewCenter(centroidZone);
          this.olMapService.setViewZoom(19);
        }
      }
    });
  }

  private pathToLonLat(path: any): Coordinate[][] {
    return [path.map((coords) => fromLonLat([coords.lng, coords.lat]))];
  }

  getGlobalsLabel(globalCoords: any[], plantaFija?: boolean): string {
    const gCoords: any[] = [];
    globalCoords.map((gC) => {
      if (gC !== null) {
        gCoords.push(gC);
      }
    });

    // si la planta es de seguidores quitamos el último elemento
    if (plantaFija !== undefined && plantaFija === false) {
      gCoords.pop();
    }

    return gCoords.join('.');
  }

  private getStyleZonas(focus: boolean) {
    const estilosView = [
      this.getStyleMae(focus),
      this.getStyleCelsCalientes(focus),
      this.getStyleGradienteNormMax(focus),
    ];

    return estilosView[this.toggleViewSelected];
  }

  // ESTILOS MAE
  private getStyleMae(focus: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: focus ? 'white' : this.getColorMae(feature, 1),
            width: this.currentZoom >= this.zoomChangeView ? 2 : 4,
          }),
          fill:
            this.currentZoom >= this.zoomChangeView
              ? null
              : new Fill({
                  color: this.getColorMae(feature, 0.6),
                }),
          text: this.getLabelStyle(feature),
        });
      }
    };
  }

  private getColorMae(feature: Feature, opacity: number) {
    const mae = feature.getProperties().properties.mae as number;

    if (mae < 0.01) {
      return COLOR.colores_severity_rgb[0].replace(',1)', ',' + opacity + ')');
    } else if (mae < 0.05) {
      return COLOR.colores_severity_rgb[1].replace(',1)', ',' + opacity + ')');
    } else {
      return COLOR.colores_severity_rgb[2].replace(',1)', ',' + opacity + ')');
    }
  }

  // ESTILOS CELS CALIENTES
  private getStyleCelsCalientes(focus: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: focus ? 'white' : this.getColorCelsCalientes(feature, 1),
            width: this.currentZoom >= this.zoomChangeView ? 2 : 4,
          }),
          fill:
            this.currentZoom >= this.zoomChangeView
              ? null
              : new Fill({
                  color: this.getColorCelsCalientes(feature, 0.6),
                }),
          text: this.getLabelStyle(feature),
        });
      }
    };
  }

  private getColorCelsCalientes(feature: Feature, opacity: number) {
    const celsCalientes = feature.getProperties().properties.celsCalientes;

    if (celsCalientes < 0.02) {
      return COLOR.colores_severity_rgb[0].replace(',1)', ',' + opacity + ')');
    } else if (celsCalientes < 0.1) {
      return COLOR.colores_severity_rgb[1].replace(',1)', ',' + opacity + ')');
    } else {
      return COLOR.colores_severity_rgb[2].replace(',1)', ',' + opacity + ')');
    }
  }

  // ESTILOS GRADIENTE NORMALIZADO MAX
  private getStyleGradienteNormMax(focus: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: focus ? 'white' : this.getColorGradienteNormMax(feature, 1),
            width: this.currentZoom >= this.zoomChangeView ? 2 : 4,
          }),
          fill:
            this.currentZoom >= this.zoomChangeView
              ? null
              : new Fill({
                  color: this.getColorGradienteNormMax(feature, 0.6),
                }),
          text: this.getLabelStyle(feature),
        });
      }
    };
  }

  private getColorGradienteNormMax(feature: Feature, opacity: number) {
    const gradNormMax = feature.getProperties().properties.gradienteNormalizado as number;

    if (gradNormMax < 10) {
      return COLOR.colores_severity_rgb[0].replace(',1)', ',' + opacity + ')');
    } else if (gradNormMax < 40) {
      return COLOR.colores_severity_rgb[1].replace(',1)', ',' + opacity + ')');
    } else {
      return COLOR.colores_severity_rgb[2].replace(',1)', ',' + opacity + ')');
    }
  }

  private getLabelStyle(feature: Feature) {
    return new Text({
      text: feature.getProperties().properties.id,
      font: 'bold 14px Roboto',
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 4,
      }),
    });
  }
}
