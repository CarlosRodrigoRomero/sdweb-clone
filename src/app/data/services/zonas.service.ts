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

import { OlMapService } from './ol-map.service';

import { LocationAreaInterface } from '@core/models/location';
import { ReportControlService } from './report-control.service';

@Injectable({
  providedIn: 'root',
})
export class ZonasService {
  private map: Map;
  private selectedInformeId: string;

  constructor(private olMapService: OlMapService, private reportControlService: ReportControlService) {}

  initService(): Promise<boolean> {
    return new Promise((initService) => {
      this.olMapService.getMap().subscribe((map) => (this.map = map));

      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));

      initService(true);
    });
  }

  createZonasLayer(informeId: string): VectorLayer {
    const layer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: new Style({
        fill: new Fill({
          color: 'rgba(0,0,0,0)',
        }),
        stroke: new Stroke({
          color: 'white',
          width: 4,
        }),
      }),
    });
    layer.setProperties({
      informeId,
      id: '0',
    });

    return layer;
  }

  addZonas(zonas: LocationAreaInterface[], layers: VectorLayer[]) {
    console.log(zonas, layers);
    // Para cada vector layer (que corresponde a un informe)
    layers.forEach((l) => {
      const source = l.getSource();
      source.clear();
      zonas.forEach((zona) => {
        const coords = this.pathToLonLat(zona.path);
        // crea poligono seguidor
        const feature = new Feature({
          geometry: new Polygon(coords),
          properties: {
            id: this.getGlobalsLabel(zona.globalCoords),
            informeId: l.getProperties().informeId,
            centroid: this.olMapService.getCentroid(coords[0]),
          },
        });
        source.addFeature(feature);
      });
    });

    // añadimos acciones sobre las zonas
    // this.addOnHoverAction();
    this.addSelectInteraction();

    // this.addClickOutFeatures();
  }

  private addSelectInteraction() {
    const select = new Select({
      // style: this.getStyleSeguidores(),
      // condition: click,
      // layers: (l) => {
      //   if (
      //     l.getProperties().informeId === this.selectedInformeId &&
      //     // tslint:disable-next-line: triple-equals
      //     l.getProperties().id == this.toggleViewSelected
      //   ) {
      //     return true;
      //   } else {
      //     return false;
      //   }
      // },
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

  private getGlobalsLabel(globalCoords: any[]): string {
    const gCoords: any[] = [];
    globalCoords.map((gC) => {
      if (gC !== null) {
        gCoords.push(gC);
      }
    });
    return gCoords.join('.');
  }
}
