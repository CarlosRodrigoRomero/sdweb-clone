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
import { GLOBAL } from '@data/constants/global';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

@Injectable({
  providedIn: 'root',
})
export class ZonesControlService {
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

  createZonasLayers(informeId: string): VectorLayer {
    console.log(informeId);
    const maeLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleMae(false),
    });
    maeLayer.setProperties({
      informeId,
      id: '0',
    });

    return maeLayer;
  }

  addZonas(zonas: LocationAreaInterface[], layers: VectorLayer[]) {
    // Para cada vector maeLayer (que corresponde a un informe)
    layers.forEach((l) => {
      const elemsLayer = this.getElemsLayer(l);
      console.log(elemsLayer);
      const source = l.getSource();
      source.clear();
      zonas.forEach((zona) => {
        // const elemsZona = elemsLayer.filter((elem) => elem.globalCoords);
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

  private getElemsLayer(layer: VectorLayer) {
    const informeId = layer.getProperties().informeId;
    const allElems = this.reportControlService.allFilterableElements;
    const elemsLayer = allElems.filter((elem) => elem.informeId === informeId);
    if (this.reportControlService.plantaFija) {
      return elemsLayer as Anomalia[];
    } else {
      return elemsLayer as Seguidor[];
    }
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

  // ESTILOS MAE
  private getStyleMae(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: focused ? 'white' : 'red' /* this.getColorMae(feature) */,
            width: focused ? 6 : 4,
          }),
          fill: new Fill({
            color: 'rgba(255,255,255, 0)',
          }),
        });
      }
    };
  }

  private getColorMae(feature: Feature) {
    const mae = feature.getProperties().properties.mae as number;

    if (mae < 0.01) {
      return GLOBAL.colores_mae[0];
    } else if (mae < 0.05) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }
}
