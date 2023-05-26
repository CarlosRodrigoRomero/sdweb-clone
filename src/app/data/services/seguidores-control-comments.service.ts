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

import { Colors } from '@core/classes/colors';
import { Seguidor } from '@core/models/seguidor';

@Injectable({
  providedIn: 'root',
})
export class SeguidoresControlCommentsService {
  private currentZoom: number;
  private seguidoresLayer: VectorImageLayer<any>;
  private listaSeguidores: Seguidor[];

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
        this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidoresLayer = layers[0]))
      );

      initService();
    });
  }

  createCommentsSeguidoresLayers(): VectorImageLayer<any> {
    const layer = new VectorImageLayer({
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
      this.comentariosControlService.seguidores$.subscribe((segs) => {
        this.listaSeguidores = segs;

        // dibujamos los seguidores
        this.dibujarSeguidores(this.listaSeguidores);
      })
    );
  }

  private dibujarSeguidores(seguidores: Seguidor[]) {
    const source = this.seguidoresLayer.getSource() as VectorSource<any>;
    source.clear();
    seguidores.forEach((seg) => {
      // solo añadimos los que tienen anomalías
      if (seg.anomaliasCliente.length > 0) {
        const anomsChecked = seg.anomaliasCliente.filter(
          (anom) => anom.hasOwnProperty('comentarios') && anom.comentarios.length > 0
        );

        const feature = new Feature({
          geometry: new Polygon([seg.featureCoords]),
          properties: {
            seguidorId: seg.id,
            type: 'seguidores',
            checked: anomsChecked.length === seg.anomaliasCliente.length,
            label: seg.nombre + '\n' + anomsChecked.length + '/' + seg.anomaliasCliente.length,
          },
        });

        source.addFeature(feature);
      }
    });
  }

  // ESTILOS
  getStyleSegs(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color:
              this.currentZoom >= this.viewCommentsService.zoomChangeSegsView
                ? focused
                  ? 'white'
                  : this.getColor(feature, 1)
                : focused
                ? 'white'
                : 'black',
            width: this.currentZoom >= this.viewCommentsService.zoomChangeSegsView ? 4 : focused ? 2 : 1,
          }),
          fill: new Fill({
            color:
              this.currentZoom >= this.viewCommentsService.zoomChangeSegsView
                ? 'rgba(0,0,0,0)'
                : this.getColor(feature, 0.9),
          }),
          text: this.getLabelSegStyle(feature),
        });
      }
    };
  }

  private getColor(feature: Feature<any>, opacity: number): string {
    return Colors.getColorComentarios(feature.getProperties().properties.checked, opacity);
  }

  private getLabelSegStyle(feature: Feature<any>) {
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
    this.seguidoresLayer = undefined;
    this.listaSeguidores = undefined;

    this.subscriptions.unsubscribe();
  }
}
