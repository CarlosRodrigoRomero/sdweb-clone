import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';

import { OlMapService } from './ol-map.service';
import { Feature } from 'ol';

import { ViewCommentsService } from './view-comments.service';
import { FilterService } from './filter.service';

import { Anomalia } from '@core/models/anomalia';
import Polygon from 'ol/geom/Polygon';
import { COLOR } from '@data/constants/color';
import { Colors } from '@core/classes/colors';

@Injectable({
  providedIn: 'root',
})
export class AnomaliasControlCommentsService {
  private currentZoom: number;
  public listaAnomalias: Anomalia[];
  private anomaliaLayer: VectorLayer;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private viewCommentsService: ViewCommentsService,
    private filterService: FilterService
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

  createCommentsAnomaliaLayers(informeId: string): VectorLayer {
    const perdidasLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnoms(false),
      visible: false,
    });
    perdidasLayer.setProperties({
      informeId,
      type: 'anomalias',
    });

    return perdidasLayer;
  }

  mostrarAnomalias(): void {
    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((anomalias) => {
        this.listaAnomalias = anomalias as Anomalia[];

        // dibujamos las anomalias del informe de comentarios
        this.dibujarAnomalias(this.listaAnomalias);
      })
    );
  }

  private dibujarAnomalias(anomalias: Anomalia[]) {
    const source = this.anomaliaLayer.getSource();
    source.clear();
    anomalias.forEach((anom) => {
      const feature = new Feature({
        geometry: new Polygon([anom.featureCoords]),
        properties: {
          anomaliaId: anom.id,
          informeId: anom.informeId,
          type: 'anomalia',
          checked: anom.revisada,
        },
      });

      source.addFeature(feature);
    });
  }

  // ESTILOS PERDIDAS
  getStyleAnoms(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color:
              this.currentZoom >= this.viewCommentsService.zoomShowAnoms
                ? focused
                  ? 'white'
                  : this.getColor(feature, 1)
                : focused
                ? 'white'
                : 'black',
            width: this.currentZoom >= this.viewCommentsService.zoomShowAnoms ? 4 : focused ? 2 : 1,
          }),
          fill: new Fill({
            color:
              this.currentZoom >= this.viewCommentsService.zoomShowAnoms
                ? 'rgba(255,255,255, 0)'
                : this.getColor(feature, 0.9),
          }),
        });
      }
    };
  }

  private getColor(feature: Feature, opacity: number): string {
    return Colors.getColorComentarios(feature.getProperties().properties.checked, opacity);
  }

  resetService() {
    this.subscriptions.unsubscribe();
  }
}
