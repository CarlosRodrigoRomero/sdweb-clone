import { Injectable } from '@angular/core';

import { Subscription } from 'rxjs';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { Feature } from 'ol';

import { OlMapService } from './ol-map.service';
import { ViewCommentsService } from './view-comments.service';
import { FilterService } from './filter.service';

import { Colors } from '@core/classes/colors';
import { Seguidor } from '@core/models/seguidor';
import Polygon from 'ol/geom/Polygon';

@Injectable({
  providedIn: 'root',
})
export class SeguidoresControlCommentsService {
  private currentZoom: number;
  private seguidoresLayer: VectorLayer;
  private listaSeguidores: Seguidor[];

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
        this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidoresLayer = layers[0]))
      );

      initService();
    });
  }

  createCommentsSeguidoresLayers(): VectorLayer {
    const layer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleSegs(false),
      visible: false,
    });
    layer.setProperties({
      type: 'seguidores',
    });

    return layer;
  }

  mostrarSeguidores(): void {
    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((elems) => {
        this.listaSeguidores = elems as Seguidor[];

        // dibujamos los seguidores
        this.dibujarSeguidores(this.listaSeguidores);
      })
    );
  }

  private dibujarSeguidores(seguidores: Seguidor[]) {
    const source = this.seguidoresLayer.getSource();
    source.clear();
    seguidores.forEach((seg) => {
      const feature = new Feature({
        geometry: new Polygon([seg.featureCoords]),
        properties: {
          seguidorId: seg.id,
          type: 'seguidores',
          // checked: seg.revisada,
        },
      });

      source.addFeature(feature);
    });
  }

  // ESTILOS
  getStyleSegs(focused: boolean) {
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
        });
      }
    };
  }

  private getColor(feature: Feature, opacity: number): string {
    return Colors.getColorComentarios(feature.getProperties().properties.checked, opacity);
  }
}
