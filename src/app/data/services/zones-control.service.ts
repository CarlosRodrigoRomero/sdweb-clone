import { Injectable } from '@angular/core';

import { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Select from 'ol/interaction/Select';
import { Map } from 'ol';
import { click } from 'ol/events/condition';

import { OlMapService } from './ol-map.service';
import { FilterService } from './filter.service';
import { ReportControlService } from './report-control.service';
import { ViewReportService } from './view-report.service';

import { LocationAreaInterface } from '@core/models/location';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { FilterableElement } from '@core/models/filterableInterface';

import { GLOBAL } from '@data/constants/global';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ZonesControlService {
  private map: Map;
  zoomChangeView = 19;
  private selectedInformeId: string;
  private toggleViewSelected: number;
  private seguidoresLayers: VectorLayer[];
  private currentLayerHovered: VectorLayer;
  private prevLayerHovered: VectorLayer;
  private currentZoom: number;

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private viewReportService: ViewReportService
  ) {}

  initService(): Promise<boolean> {
    return new Promise((initService) => {
      this.olMapService.getMap().subscribe((map) => (this.map = map));

      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));

      this.viewReportService.toggleViewSelected$.subscribe((viewSel) => (this.toggleViewSelected = viewSel));

      this.olMapService
        .getSeguidorLayers()
        .pipe(take(1))
        .subscribe((layers) => (this.seguidoresLayers = layers));

      this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom));

      initService(true);
    });
  }

  createZonasLayers(informeId: string): VectorLayer {
    const maeLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleMae(false),
    });
    maeLayer.setProperties({
      informeId,
      view: 0,
    });

    return maeLayer;
  }

  mostrarZonas(zonas: LocationAreaInterface[], layers: VectorLayer[]) {
    this.filterService.filteredElements$.subscribe((elems) => {
      this.addZonas(zonas, layers, elems);
    });
  }

  private addZonas(zonas: LocationAreaInterface[], layers: VectorLayer[], elems: FilterableElement[]) {
    // Para cada vector maeLayer (que corresponde a un informe)
    layers.forEach((l) => {
      const informeId = l.getProperties().informeId;
      const elemsInforme = this.reportControlService.allFilterableElements.filter(
        (elem) => elem.informeId === informeId
      );
      const elemsFiltered = elems.filter((elem) => elem.informeId === informeId);
      const source = l.getSource();
      source.clear();
      zonas.forEach((zona) => {
        const elemsFilteredZona = this.getElemsZona(zona, elemsFiltered);
        // si no hay seguidores dentro de la zona no la añadimos
        if (elemsFilteredZona.length > 0) {
          const allElemsZona = this.getElemsZona(zona, elemsInforme);
          // para anomalías enviamos el numero de zonas para calcular el MAE
          let mae = 0;
          if (this.reportControlService.plantaFija) {
            mae = this.getMaeZona(allElemsZona, informeId, elemsInforme.length);
          } else {
            mae = this.getMaeZona(allElemsZona, informeId);
          }
          const coords = this.pathToLonLat(zona.path);
          // crea poligono seguidor
          const feature = new Feature({
            geometry: new Polygon(coords),
            properties: {
              id: this.getGlobalsLabel(zona.globalCoords),
              informeId,
              centroid: this.olMapService.getCentroid(coords[0]),
              mae,
              type: 'zone',
            },
          });
          source.addFeature(feature);
        }
      });
    });

    // añadimos acciones sobre las zonas
    this.addOnHoverAction();
    // this.addSelectInteraction();

    // this.addClickOutFeatures();
  }

  getElemsZona(zona: LocationAreaInterface, elems: FilterableElement[]) {
    let elemsZona: FilterableElement[] = [];
    zona.globalCoords.forEach((gC, index) => {
      if (gC !== null) {
        elemsZona = elems.filter((elem) => elem.globalCoords[index] === gC);
      }
    });

    return elemsZona;
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

  private addOnHoverAction() {
    let currentFeatureHover;
    const estilosViewFocused = [
      this.getStyleMae(true),
      // this.getStyleSeguidoresCelsCalientes(true),
      // this.getStyleSeguidoresGradienteNormMax(true),
    ];
    const estilosViewUnfocused = [
      this.getStyleMae(false),
      // this.getStyleSeguidoresCelsCalientes(false),
      // this.getStyleSeguidoresGradienteNormMax(false),
    ];

    this.map.on('pointermove', (event) => {
      if (this.currentZoom < this.zoomChangeView) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          const feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId)
            .filter((item) => item.getProperties().properties.type === 'zone')[0] as Feature;
          // .filter((item) => item.getProperties().properties.view === this.toggleViewSelected);

          if (feature !== undefined) {
            if (this.reportControlService.plantaFija) {
            } else {
              // cuando pasamos de una zona a otra directamente sin pasar por vacio
              if (this.prevLayerHovered !== undefined) {
                this.prevLayerHovered.setVisible(false);
              }
              this.currentLayerHovered = this.seguidoresLayers.find(
                (l) =>
                  l.getProperties().zoneId === feature.getProperties().properties.id &&
                  l.getProperties().view === this.toggleViewSelected
              );
              this.currentLayerHovered.setVisible(true);

              this.prevLayerHovered = this.currentLayerHovered;
            }
          }

          // if (feature !== undefined) {
          //   // cuando pasamos de un seguidor a otro directamente sin pasar por vacio
          //   if (this.prevFeatureHover !== undefined) {
          //     this.prevFeatureHover.setStyle(estilosViewUnfocused[this.toggleViewSelected]);
          //   }
          //   currentFeatureHover = feature;

          //   const seguidorId = feature.getProperties().properties.seguidorId;
          //   const seguidor = this.listaSeguidores.filter((seg) => seg.id === seguidorId)[0];

          //   feature.setStyle(estilosViewFocused[this.toggleViewSelected]);

          //   if (this.selectedInformeId === seguidor.informeId) {
          //     this.seguidorHovered = seguidor;
          //   }
          //   this.prevFeatureHover = feature;
          // }
        } else {
          if (this.currentLayerHovered !== undefined) {
            this.currentLayerHovered.setVisible(false);
          }
          // this.seguidorHovered = undefined;
          // if (currentFeatureHover !== undefined) {
          //   currentFeatureHover.setStyle(estilosViewUnfocused[this.toggleViewSelected]);
          //   currentFeatureHover = undefined;
          // }
        }
      }
    });
  }

  private addSelectInteraction() {
    const select = new Select({
      // style: this.getStyleSeguidores(),
      condition: click,
      layers: (l) => {
        if (
          l.getProperties().informeId === this.selectedInformeId &&
          // tslint:disable-next-line: triple-equals
          // l.getProperties().view == this.toggleViewSelected &&
          !l.getProperties().hasOwnProperty('zone')
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
          const center = e.selected[0].getProperties().properties.centroid;

          this.olMapService.setViewCenter(center);
          this.olMapService.setViewZoom(19);
        }
      }
    });
  }

  private pathToLonLat(path: any): Coordinate[][] {
    return [path.map((coords) => fromLonLat([coords.lng, coords.lat]))];
  }

  getGlobalsLabel(globalCoords: any[]): string {
    const gCoords: any[] = [];
    globalCoords.map((gC) => {
      if (gC !== null) {
        gCoords.push(gC);
      }
    });
    return gCoords.join('.');
  }

  // ESTILOS MAE
  private getStyleMae(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: focused ? 'white' : this.getColorMae(feature, 1),
            width: focused ? 6 : 4,
          }),
          fill: new Fill({
            color: focused ? 'white' : this.getColorMae(feature, 0.1),
          }),
        });
      }
    };
  }

  private getColorMae(feature: Feature, opacity: number) {
    const mae = feature.getProperties().properties.mae as number;

    if (mae < 0.01) {
      return GLOBAL.colores_mae_rgb[0].replace(',1)', ',' + opacity + ')');
    } else if (mae < 0.05) {
      return GLOBAL.colores_mae_rgb[1].replace(',1)', ',' + opacity + ')');
    } else {
      return GLOBAL.colores_mae_rgb[2].replace(',1)', ',' + opacity + ')');
    }
  }
}
