import { Injectable } from '@angular/core';

import { Subscription } from 'rxjs';

import { Feature, Map } from 'ol';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Select } from 'ol/interaction';

import { OlMapService } from './ol-map.service';
import { FilterService } from './filter.service';
import { ZonesControlService } from './zones-control.service';
import { ViewCommentsService } from './view-comments.service';
import { ReportControlService } from './report-control.service';
import { ComentariosControlService } from './comentarios-control.service';

import { LocationAreaInterface } from '@core/models/location';
import { FilterableElement } from '@core/models/filterableInterface';

import { Colors } from '@core/classes/colors';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

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
    private viewCommentsService: ViewCommentsService,
    private reportControlService: ReportControlService,
    private comentariosControlService: ComentariosControlService
  ) {}

  initService(): Promise<boolean> {
    return new Promise((initService) => {
      this.subscriptions.add(
        this.olMapService.getMap().subscribe((map) => {
          this.map = map;

          if (this.map !== undefined) {
            initService(true);

            // añadimos acciones sobre las zonas
            this.addSelectInteraction();
          }
        })
      );

      this.subscriptions.add(this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom)));
    });
  }

  createSmallZonesLayer(informeId: string): VectorLayer {
    const layer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getSmallZonesStyle(),
      visible: true,
    });
    layer.setProperties({
      informeId,
      type: 'smallZones',
    });

    return layer;
  }

  mostrarSmallZones(zonas: LocationAreaInterface[], layers: VectorLayer[]) {
    if (this.reportControlService.plantaFija) {
      this.subscriptions.add(
        this.comentariosControlService.anomalias$.subscribe((anoms) => this.addSmallZones(zonas, layers, anoms))
      );
    } else {
      this.subscriptions.add(
        this.comentariosControlService.seguidores$.subscribe((segs) => this.addSmallZones(zonas, layers, segs))
      );
    }
  }

  private addSmallZones(zonas: LocationAreaInterface[], layers: VectorLayer[], elems: FilterableElement[]) {
    // Para cada vector maeLayer (que corresponde a un informe)
    layers.forEach((l) => {
      const source = l.getSource();
      source.clear();
      zonas.forEach((zona) => {
        const elemsZona = this.zonesControlService.getElemsZona(zona, elems);

        // solo añadimos las zonas con anomalias
        if (elemsZona.length > 0) {
          let elemsChecked;
          if (this.reportControlService.plantaFija) {
            const anomsZona = elemsZona as Anomalia[];
            elemsChecked = anomsZona.filter(
              (anom) => anom.hasOwnProperty('comentarios') && anom.comentarios.length > 0
            );
          } else {
            const segsZona = elemsZona as Seguidor[];
            elemsChecked = segsZona.filter((seg) => {
              const anomsChecked = seg.anomaliasCliente.filter(
                (anom) => anom.hasOwnProperty('comentarios') && anom.comentarios.length > 0
              );

              return anomsChecked.length === seg.anomaliasCliente.length;
            });
          }

          const coords = this.zonesControlService.pathToLonLat(zona.path);

          // crea poligono seguidor
          const feature = new Feature({
            geometry: new Polygon(coords),
            properties: {
              // id: this.getGlobalsLabel(zona.globalCoords),
              // informeId,
              centroid: this.olMapService.getCentroid(coords[0]),
              // type: 'zone',
              // area: this.getArea(coords),
              numElems: elemsZona.length,
              numChecked: elemsChecked.length,
              label: this.getSmallGlobal(zona.globalCoords) + '\n\n' + elemsChecked.length + '/' + elemsZona.length,
            },
          });
          source.addFeature(feature);
        }
      });
    });
  }

  private getSmallGlobal(globalCoords: string[]): string {
    const notNullGlobals = globalCoords.filter((gC) => gC !== null);
    const indexGlobal = notNullGlobals.length - 1;

    let nombreGlobal = '';
    if (this.reportControlService.planta.hasOwnProperty('nombreGlobalCoords')) {
      nombreGlobal = this.reportControlService.planta.nombreGlobalCoords[indexGlobal];
    }

    let label = notNullGlobals[indexGlobal].toString();
    if (nombreGlobal !== '') {
      label = nombreGlobal + ' ' + label;
    }

    return label;
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

  private addSelectInteraction() {
    const select = new Select({
      style: this.getSmallZonesStyle(),
      layers: (l) => {
        if (l.getProperties().hasOwnProperty('type') && l.getProperties().type === 'smallZones') {
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
          const zoomIn = this.viewCommentsService.zoomShowAnoms;
          if (this.currentZoom < zoomIn) {
            const centroidZone = e.selected[0].getProperties().properties.centroid;

            this.olMapService.setViewCenter(centroidZone);
            this.olMapService.setViewZoom(zoomIn);
          }
        }
      }
    });
  }

  // ESTILOS ZONAS PEQUEÑAS
  private getSmallZonesStyle() {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: this.currentZoom >= this.viewCommentsService.zoomShowAnoms ? this.getColor(feature, 1) : 'black',
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
    this.map = undefined;
    this.currentZoom = undefined;

    this.subscriptions.unsubscribe();
  }
}
