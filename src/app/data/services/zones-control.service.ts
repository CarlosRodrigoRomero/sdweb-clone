import { Injectable } from '@angular/core';

import { Subscription } from 'rxjs';

import { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Map } from 'ol';
import { Select } from 'ol/interaction';
import VectorImageLayer from 'ol/layer/VectorImage';

import { OlMapService } from './ol-map.service';
import { FilterService } from './filter.service';
import { ReportControlService } from './report-control.service';
import { ViewReportService } from './view-report.service';

import { LocationAreaInterface } from '@core/models/location';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { FilterableElement } from '@core/models/filterableInterface';
import { ZoneInterface } from '@core/models/zone';

import { COLOR } from '@data/constants/color';

import { Colors } from '@core/classes/colors';

@Injectable({
  providedIn: 'root',
})
export class ZonesControlService {
  private map: Map;
  zoomChangeView = 18;
  private selectedInformeId: string;
  private toggleViewSelected: string;
  private featureHovered: Feature;
  private prevFeatureHovered: Feature;
  private currentZoom: number;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private viewReportService: ViewReportService
  ) {}

  initService(): Promise<boolean> {
    return new Promise((initService) => {
      if (this.reportControlService.planta.hasOwnProperty('zoomCambioVista')) {
        this.zoomChangeView = this.reportControlService.planta.zoomCambioVista;
      } else if (this.reportControlService.plantaFija) {
        this.zoomChangeView = 20;
      }

      this.subscriptions.add(
        this.olMapService.getMap().subscribe((map) => {
          this.map = map;

          if (this.map !== undefined) {
            initService(true);

            // añadimos acciones sobre las zonas
            this.addOnHoverAction();
            this.addSelectInteraction();
          }
        })
      );

      this.subscriptions.add(
        this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
      );

      this.subscriptions.add(
        this.viewReportService.reportViewSelected$.subscribe((viewSel) => (this.toggleViewSelected = viewSel))
      );

      this.subscriptions.add(this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom)));
    });
  }

  createZonasLayers(informeId: string): VectorImageLayer[] {
    const maeLayer = new VectorImageLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleMae(false),
      visible: false,
    });
    maeLayer.setProperties({
      informeId,
      view: 'mae',
      type: 'zonas',
    });

    const ccLayer = new VectorImageLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleCelsCalientes(false),
      visible: false,
    });
    ccLayer.setProperties({
      informeId,
      view: 'cc',
      type: 'zonas',
    });

    const gradLayer = new VectorImageLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleGradienteNormMax(false),
      visible: false,
    });
    gradLayer.setProperties({
      informeId,
      view: 'grad',
      type: 'zonas',
    });

    return [maeLayer, ccLayer, gradLayer];
  }

  createZonas(locAreas: LocationAreaInterface[]): ZoneInterface[] {
    const zones: ZoneInterface[] = [];
    this.reportControlService.informesIdList.forEach((informeId) => {
      const elemsInforme = this.reportControlService.allFilterableElements.filter(
        (elem) => elem.informeId === informeId
      );

      locAreas.forEach((locArea) => {
        const elemsZone = this.getElemsZona(locArea, elemsInforme);

        const zone: ZoneInterface = {
          id: this.getGlobalsLabel(locArea.globalCoords),
          informeId,
          elems: elemsZone,
          globalCoords: locArea.globalCoords,
          path: locArea.path,
        };

        zones.push(zone);
      });
    });

    return zones;
  }

  mostrarZonas(zones: ZoneInterface[], layers: VectorImageLayer[]) {
    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((elems) => {
        this.addZonas(zones, layers, elems);
      })
    );
  }

  private addZonas(zonas: ZoneInterface[], layers: VectorImageLayer[], elems: FilterableElement[]) {
    // Para cada vector maeLayer (que corresponde a un informe)
    layers.forEach((l) => {
      const view = l.getProperties().view;
      const informeId = l.getProperties().informeId;
      const source = l.getSource() as VectorSource;
      source.clear();
      const zonasInforme = zonas.filter((z) => z.informeId === informeId);
      zonasInforme.forEach((zona) => {
        const elemsZona = zona.elems;
        let elemsFilteredZona = elemsZona.filter((elem) => elems.includes(elem));

        // filtramos solo las cels calientes para la vista de cels calientes
        if (l.getProperties().view === 'cc') {
          if (this.reportControlService.plantaFija) {
            elemsFilteredZona = elemsFilteredZona.filter((elem) => elem.tipo == 8 || elem.tipo == 9);
          }
        }

        const property = this.getPropertyView(view, informeId, zona, zonasInforme, elemsZona);

        const coords = this.pathToLonLat(zona.path);

        // crea poligono seguidor
        const feature = new Feature({
          geometry: new Polygon(coords),
          properties: {
            id: this.getGlobalsLabel(zona.globalCoords),
            informeId,
            centroid: this.olMapService.getCentroid(coords[0]),
            type: 'zone',
            area: this.getArea(coords),
            numElems: elemsFilteredZona.length,
            name: this.getSmallGlobal(zona.globalCoords),
            [property.type]: property.value,
          },
        });
        source.addFeature(feature);
      });
    });
  }

  private getSmallGlobal(globalCoords: string[]): string {
    const notNullGlobals = globalCoords.filter((gC) => gC !== null);
    return notNullGlobals[notNullGlobals.length - 1].toString();
  }

  private getArea(coords: Coordinate[][]): number {
    const polygon = new Polygon(coords);
    return polygon.getArea();
  }

  private getPropertyView(
    view: string,
    informeId: string,
    zona: LocationAreaInterface,
    zonas: LocationAreaInterface[],
    allElemsZona: FilterableElement[]
  ): any {
    // console.log(view, informeId, zona, zonas.length, allElemsZona.length);
    switch (view) {
      case 'mae':
        let mae = 0;
        // para anomalías enviamos el numero de zonas para calcular el MAE
        if (this.reportControlService.plantaFija) {
          mae = this.getMaeZona(allElemsZona, informeId, zona, zonas);
        } else {
          mae = this.getMaeZona(allElemsZona, informeId);
        }
        return { type: 'mae', value: mae };
      case 'cc':
        let celsCalientes = 0;
        // para anomalías enviamos el numero de zonas para calcular el CC
        if (this.reportControlService.plantaFija) {
          celsCalientes = this.getCCZona(allElemsZona, informeId, zona, zonas);
        } else {
          celsCalientes = this.getCCZona(allElemsZona, informeId);
        }
        return { type: 'celsCalientes', value: celsCalientes };
      case 'grad':
        const grad = this.getGradNormMaxZona(allElemsZona);
        return { type: 'gradienteNormalizado', value: grad };
      case 'tipo':
        return { type: 'tipo', value: null };
    }
  }

  getElemsZona(zona: LocationAreaInterface, elems: FilterableElement[]) {
    const zonaPolygon = new Polygon([this.olMapService.pathToCoordinate(zona.path)]);

    return elems.filter((elem) => {
      const elemCentroid = this.olMapService.getCentroid(elem.featureCoords);

      return zonaPolygon.intersectsCoordinate(elemCentroid);
    });
  }

  private getMaeZona(
    elems: FilterableElement[],
    informeId: string,
    zona?: LocationAreaInterface,
    zonas?: LocationAreaInterface[]
  ): number {
    const informe = this.reportControlService.informes.find((inf) => inf.id === informeId);
    let mae = 0;
    if (zona) {
      const anomaliasZona = elems as Anomalia[];
      if (anomaliasZona.length > 0) {
        const perdidasTotales = anomaliasZona.reduce((acc, curr) => acc + curr.perdidas, 0);
        const areaZona = this.getArea(this.pathToLonLat(zona.path));
        const areaTotalZonas = zonas.reduce((acc, curr) => acc + this.getArea(this.pathToLonLat(curr.path)), 0);

        // obtenemos el nº de modulos ponderados al area de la zona
        mae = perdidasTotales / ((informe.numeroModulos * areaZona) / areaTotalZonas);
      }
    } else {
      const seguidoresZona = elems as Seguidor[];
      seguidoresZona.forEach((seg) => (mae = mae + seg.mae));
      mae = mae / seguidoresZona.length;
    }

    return mae;
  }

  private getCCZona(
    elems: FilterableElement[],
    informeId: string,
    zona?: LocationAreaInterface,
    zonas?: LocationAreaInterface[]
  ): number {
    const informe = this.reportControlService.informes.find((inf) => inf.id === informeId);
    let cc = 0;
    if (zona) {
      const anomaliasZona = elems as Anomalia[];
      if (anomaliasZona.length > 0) {
        const celsCalientes = anomaliasZona.filter((anom) => anom.tipo === 8 || anom.tipo === 9);
        const areaZona = this.getArea(this.pathToLonLat(zona.path));
        const areaTotalZonas = zonas.reduce((acc, curr) => acc + this.getArea(this.pathToLonLat(curr.path)), 0);

        // obtenemos el nº de modulos ponderados al area de la zona
        cc = celsCalientes.length / ((informe.numeroModulos * areaZona) / areaTotalZonas);
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

        if (feature !== undefined && this.currentZoom < this.zoomChangeView) {
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
          const zoomIn = this.zoomChangeView;
          if (this.currentZoom < zoomIn) {
            const centroidZone = e.selected[0].getProperties().properties.centroid;

            this.olMapService.setViewCenter(centroidZone);
            this.olMapService.setViewZoom(zoomIn);
          }
        }
      }
    });
  }

  pathToLonLat(path: any): Coordinate[][] {
    return [path.map((coords) => fromLonLat([coords.lng, coords.lat]))];
  }

  getGlobalsLabel(globalCoords: any[], plantaFija?: boolean): string {
    const gCoords: any[] = [];
    globalCoords.map((gC) => {
      if (gC !== null && gC !== '') {
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
    const estilosView = {
      mae: this.getStyleMae(focus),
      cc: this.getStyleCelsCalientes(focus),
      grad: this.getStyleGradienteNormMax(focus),
      tipo: null,
    };

    return estilosView[this.toggleViewSelected];
  }

  // ESTILO SIN ANOMALIAS
  private getNoAnomsStyle(feature: Feature, focused: boolean) {
    return new Style({
      stroke: new Stroke({
        color:
          this.currentZoom >= this.zoomChangeView
            ? Colors.hexToRgb(COLOR.color_no_anoms, 1)
            : focused
            ? 'white'
            : 'black',
        width: this.currentZoom >= this.zoomChangeView ? 2 : focused ? 2 : 1,
      }),
      fill:
        this.currentZoom >= this.zoomChangeView
          ? null
          : new Fill({
              color: Colors.hexToRgb(COLOR.color_no_anoms, 0.9),
            }),
      text: this.getLabelStyle(feature),
    });
  }

  // ESTILOS MAE
  private getStyleMae(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        if (feature.getProperties().properties.numElems > 0) {
          return new Style({
            stroke: new Stroke({
              color:
                this.currentZoom >= this.zoomChangeView ? this.getColorMae(feature, 1) : focused ? 'white' : 'black',
              width: this.currentZoom >= this.zoomChangeView ? 2 : focused ? 2 : 1,
            }),
            fill:
              this.currentZoom >= this.zoomChangeView
                ? null
                : new Fill({
                    color: this.getColorMae(feature, 0.9),
                  }),
            text: this.getLabelStyle(feature),
          });
        } else {
          return this.getNoAnomsStyle(feature, focused);
        }
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
  private getStyleCelsCalientes(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        if (feature.getProperties().properties.numElems > 0) {
          return new Style({
            stroke: new Stroke({
              color:
                this.currentZoom >= this.zoomChangeView
                  ? this.getColorCelsCalientes(feature, 1)
                  : focused
                  ? 'white'
                  : 'black',
              width: this.currentZoom >= this.zoomChangeView ? 2 : focused ? 2 : 1,
            }),
            fill:
              this.currentZoom >= this.zoomChangeView
                ? null
                : new Fill({
                    color: this.getColorCelsCalientes(feature, 0.9),
                  }),
            text: this.getLabelStyle(feature),
          });
        } else {
          return this.getNoAnomsStyle(feature, focused);
        }
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
  private getStyleGradienteNormMax(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        if (feature.getProperties().properties.numElems > 0) {
          return new Style({
            stroke: new Stroke({
              color:
                this.currentZoom >= this.zoomChangeView
                  ? this.getColorGradienteNormMax(feature, 1)
                  : focused
                  ? 'white'
                  : 'black',
              width: this.currentZoom >= this.zoomChangeView ? 2 : focused ? 2 : 1,
            }),
            fill:
              this.currentZoom >= this.zoomChangeView
                ? null
                : new Fill({
                    color: this.getColorGradienteNormMax(feature, 0.9),
                  }),
            text: this.getLabelStyle(feature),
          });
        } else {
          return this.getNoAnomsStyle(feature, focused);
        }
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

  getLabelStyle(feature: Feature) {
    return new Text({
      text: feature.getProperties().properties.name,
      font: 'bold 14px Roboto',
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    });
  }

  resetService() {
    this.map = undefined;
    this.zoomChangeView = 18;
    this.selectedInformeId = undefined;
    this.toggleViewSelected = undefined;
    this.featureHovered = undefined;
    this.prevFeatureHovered = undefined;
    this.currentZoom = undefined;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }
}
