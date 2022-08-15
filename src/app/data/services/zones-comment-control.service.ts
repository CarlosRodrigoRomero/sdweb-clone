import { Injectable } from '@angular/core';

import { Subscription } from 'rxjs';

import { Feature, Map } from 'ol';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';

import { OlMapService } from './ol-map.service';
import { FilterService } from './filter.service';
import { ZonesControlService } from './zones-control.service';
import { ViewCommentsService } from './view-comments.service';

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

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private filterService: FilterService,
    private zonesControlService: ZonesControlService,
    private viewCommentsService: ViewCommentsService
  ) {}

  initService(): Promise<boolean> {
    return new Promise((initService) => {
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

  createSmallZonesLayer(informeId: string): VectorLayer {
    const layer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getSmallZonesStyle(false),
      visible: true,
    });
    layer.setProperties({
      informeId,
      view: 0,
      type: 'zonas',
    });

    return layer;
  }

  mostrarSmallZones(zonas: LocationAreaInterface[], layers: VectorLayer[]) {
    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((elems) => {
        this.addSmallZones(zonas, layers, elems);
      })
    );
  }

  private addSmallZones(zonas: LocationAreaInterface[], layers: VectorLayer[], elems: FilterableElement[]) {
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
              label: this.getSmallGlobal(zona.globalCoords) + elemsChecked.length + '/' + elemsZona.length,
            },
          });
          source.addFeature(feature);
        }
      });
    });
  }

  private getSmallGlobal(globalCoords: string[]): string {
    const notNullGlobals = globalCoords.filter((gC) => gC !== null);
    return notNullGlobals[notNullGlobals.length - 1].toString();
  }

  addBigZones(bigZones: LocationAreaInterface[][]) {
    bigZones.forEach((zones, i) => {
      const source = new VectorSource();

      zones.forEach((zone) => {
        const feature = new Feature({
          geometry: new Polygon([this.olMapService.pathToCoordinate(zone.path)]),
          properties: {
            id: zone.globalCoords[i].toString(),
            tipo: 'areaGlobalCoord',
          },
        });

        source.addFeature(feature);
      });

      this.map.addLayer(
        new VectorLayer({
          source,
          style: this.getStyleBigZones(),
        })
      );
    });
  }

  // ESTILOS ZONAS PEQUEÑAS
  private getSmallZonesStyle(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color:
              this.currentZoom >= this.viewCommentsService.zoomShowAnoms
                ? this.getColor(feature, 1)
                : focused
                ? 'white'
                : 'black',
            width: this.currentZoom >= this.viewCommentsService.zoomShowAnoms ? 4 : 2,
          }),
          fill:
            this.currentZoom >= this.viewCommentsService.zoomShowAnoms
              ? null
              : new Fill({
                  color: this.getColor(feature, 0.9),
                }),
          text: this.getLabelSmallZonesStyle(feature),
        });
      }
    };
  }

  private getColor(feature: Feature, opacity: number) {
    const numChecked = feature.getProperties().properties.numChecked;
    const numElems = feature.getProperties().properties.numElems;

    return Colors.getColorComentarios(numChecked >= numElems, opacity);
  }

  getLabelSmallZonesStyle(feature: Feature) {
    return new Text({
      text: feature.getProperties().properties.label,
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

  private getStyleBigZones() {
    return (feature) => {
      if (feature !== undefined) {
        return new Style({
          stroke: new Stroke({
            color: 'black',
            width: 2,
            lineDash: [4],
          }),
          fill: null,
          text: this.getLabelBigZonesStyle(feature),
        });
      }
    };
  }

  private getLabelBigZonesStyle(feature: Feature) {
    return new Text({
      text: feature.getProperties().properties.id,
      font: 'bold 16px Roboto',
      fill: new Fill({
        color: 'white',
      }),
      stroke: new Stroke({
        color: 'black',
        width: 8,
      }),
    });
  }

  resetService() {
    this.subscriptions.unsubscribe();
  }
}
