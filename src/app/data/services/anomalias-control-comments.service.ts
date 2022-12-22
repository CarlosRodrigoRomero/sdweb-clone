import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Feature } from 'ol';
import Polygon from 'ol/geom/Polygon';
import VectorImageLayer from 'ol/layer/VectorImage';

import { OlMapService } from './ol-map.service';
import { ViewCommentsService } from './view-comments.service';
import { ComentariosControlService } from './comentarios-control.service';

import { Anomalia } from '@core/models/anomalia';

import { Colors } from '@core/classes/colors';

@Injectable({
  providedIn: 'root',
})
export class AnomaliasControlCommentsService {
  private currentZoom: number;
  public listaAnomalias: Anomalia[];
  private anomaliaLayer: VectorImageLayer;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private viewCommentsService: ViewCommentsService,
    private comentariosControlService: ComentariosControlService
  ) {}

  initService(): Promise<void> {
    return new Promise((initService) => {
      this.subscriptions.add(this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom)));

      this.subscriptions.add(
        this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayer = layers[0]))
      );

      initService();
    });
  }

  createCommentsAnomaliaLayers(): VectorImageLayer {
    const layer = new VectorImageLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnoms(false),
      visible: false,
    });
    layer.setProperties({
      type: 'anomalias',
    });

    return layer;
  }

  mostrarAnomalias(): void {
    this.subscriptions.add(
      this.comentariosControlService.anomalias$.subscribe((anomalias) => {
        this.listaAnomalias = anomalias as Anomalia[];

        // dibujamos las anomalias del informe de comentarios
        this.dibujarAnomalias(this.listaAnomalias);
      })
    );
  }

  private dibujarAnomalias(anomalias: Anomalia[]) {
    const source = this.anomaliaLayer.getSource() as VectorSource;
    source.clear();
    anomalias.forEach((anom) => {
      const feature = new Feature({
        geometry: new Polygon([anom.featureCoords]),
        properties: {
          anomaliaId: anom.id,
          informeId: anom.informeId,
          type: 'anomalia',
          checked: anom.hasOwnProperty('comentarios') && anom.comentarios.length > 0,
          label: 'F' + anom.localX + 'C' + anom.localY,
        },
      });

      source.addFeature(feature);
    });
  }

  // ESTILOS
  getStyleAnoms(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color:
              this.currentZoom >= this.viewCommentsService.zoomChangeAnomsView
                ? focused
                  ? 'white'
                  : this.getColor(feature, 1)
                : focused
                ? 'white'
                : 'black',
            width: this.currentZoom >= this.viewCommentsService.zoomChangeAnomsView ? 4 : focused ? 2 : 1,
          }),
          fill: new Fill({
            color:
              this.currentZoom >= this.viewCommentsService.zoomChangeAnomsView
                ? 'rgba(0,0,0,0)'
                : this.getColor(feature, 0.9),
          }),
          text: this.getLabeAnomStyle(feature),
        });
      }
    };
  }

  private getColor(feature: Feature, opacity: number): string {
    return Colors.getColorComentarios(feature.getProperties().properties.checked, opacity);
  }

  getExternalColor(anomalia: Anomalia, opacity: number): string {
    const anomChecked = anomalia.hasOwnProperty('comentarios') && anomalia.comentarios.length > 0;
    return Colors.getColorComentarios(anomChecked, opacity);
  }

  private getLabeAnomStyle(feature: Feature) {
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

  resetService() {
    this.currentZoom = undefined;
    this.listaAnomalias = [];
    this.anomaliaLayer = undefined;

    this.subscriptions.unsubscribe();
  }
}
