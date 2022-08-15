import { Injectable } from '@angular/core';

import { Subscription } from 'rxjs';

import { Feature, Map } from 'ol';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';

import { OlMapService } from './ol-map.service';
import { ReportControlService } from './report-control.service';
import { FilterService } from './filter.service';
import { ZonesControlService } from './zones-control.service';

import { LocationAreaInterface } from '@core/models/location';
import { FilterableElement } from '@core/models/filterableInterface';

import { COLOR } from '@data/constants/color';

import { Colors } from '@core/classes/colors';

@Injectable({
  providedIn: 'root',
})
export class ZonesCommentControlService {
  private map: Map;
  private currentZoom: number;
  zoomChangeView = 18;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private zonesControlService: ZonesControlService
  ) {}

  initService(): Promise<boolean> {
    return new Promise((initService) => {
      if (this.reportControlService.plantaFija) {
        this.zoomChangeView = 20;
      }

      this.subscriptions.add(
        this.olMapService.getMap().subscribe((map) => {
          this.map = map;

          if (this.map !== undefined) {
            initService(true);

            // añadimos acciones sobre las zonas
            // this.addSelectInteraction();
          }
        })
      );

      this.subscriptions.add(this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom)));
    });
  }

  createZonasLayer(informeId: string): VectorLayer {
    const layer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyle(false),
      visible: true,
    });
    layer.setProperties({
      informeId,
      view: 0,
      type: 'zonas',
    });

    return layer;
  }

  mostrarZonas(zonas: LocationAreaInterface[], layers: VectorLayer[]) {
    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((elems) => {
        this.addZonas(zonas, layers, elems);
      })
    );
  }

  private addZonas(zonas: LocationAreaInterface[], layers: VectorLayer[], elems: FilterableElement[]) {
    // Para cada vector maeLayer (que corresponde a un informe)
    layers.forEach((l) => {
      const informeId = l.getProperties().informeId;
      const source = l.getSource();
      source.clear();
      zonas.forEach((zona) => {
        const elemsZona = this.zonesControlService.getElemsZona(zona, elems);

        // solo añadimos las zonas con anomalias
        if (elemsZona.length > 0) {
          const elemsChecked = elemsZona.filter((elem) => elem.checked);

          const coords = this.zonesControlService.pathToLonLat(zona.path);

          // crea poligono seguidor
          const feature = new Feature({
            geometry: new Polygon(coords),
            properties: {
              // id: this.getGlobalsLabel(zona.globalCoords),
              informeId,
              // centroid: this.olMapService.getCentroid(coords[0]),
              // type: 'zone',
              // area: this.getArea(coords),
              numElems: elemsZona.length,
              numChecked: elemsChecked.length,
              // name: this.getSmallGlobal(zona.globalCoords),
            },
          });
          source.addFeature(feature);
        }
      });
    });
  }

  // ESTILOS COMENTARIOS
  private getStyle(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        if (feature.getProperties().properties.numElems > 0) {
          return new Style({
            stroke: new Stroke({
              color: this.currentZoom >= this.zoomChangeView ? this.getColor(feature, 1) : focused ? 'white' : 'black',
              width: 2,
            }),
            fill:
              this.currentZoom >= this.zoomChangeView
                ? null
                : new Fill({
                    color: this.getColor(feature, 0.9),
                  }),
            text: this.getLabelStyle(feature),
          });
        } else {
          return this.getNoAnomsStyle(feature, focused);
        }
      }
    };
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
        width: 2,
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

  private getColor(feature: Feature, opacity: number) {
    const numChecked = feature.getProperties().properties.numChecked;
    const numElems = feature.getProperties().properties.numElems;

    if (numChecked >= numElems) {
      // VERDE OK
      return COLOR.colores_severity[0].replace(',1)', ',' + opacity + ')');
    } else {
      // NARANJA PENDIENTE
      return COLOR.colores_severity[1].replace(',1)', ',' + opacity + ')');
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
        width: 4,
      }),
    });
  }
}
