import { Injectable } from '@angular/core';

import { BehaviorSubject, Subscription } from 'rxjs';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { Feature, Overlay } from 'ol';
import Polygon from 'ol/geom/Polygon';

import { OlMapService } from './ol-map.service';
import { ReportControlService } from './report-control.service';

import { Anomalia } from '@core/models/anomalia';
import VectorImageLayer from 'ol/layer/VectorImage';
import { fromLonLat } from 'ol/proj';

@Injectable({
  providedIn: 'root',
})
export class DirtyAnomsService {
  private dirtyAnomsSource: VectorSource<any>;
  private dirtyAnomsLayers: VectorImageLayer<any>[] = [];
  dirtyAnomsLayers$ = new BehaviorSubject<VectorImageLayer<any>[]>(this.dirtyAnomsLayers);
  zoomChangeView = 21;
  public map: Map;

  private subscriptions: Subscription = new Subscription();

  constructor(private olMapService: OlMapService, private reportControlService: ReportControlService) {}

  initService(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.subscriptions.add(
        this.olMapService.getMap().subscribe((map) => {
          this.map = map;

          if (this.map !== undefined) {
            this.addOnHoverDirtyAnomsAction();

            resolve(true);
          }
        })
      );
    });
  }

  createDirtyAnomsLayer(informeId: string) {
    this.dirtyAnomsSource = new VectorSource({ wrapX: false });

    const layer = new VectorImageLayer({
      source: this.dirtyAnomsSource,
      style: this.getStyleDirtyAnom(false),
      visible: false,
    });

    layer.setProperties({
      id: 'dirtyAnomsLayer',
      informeId,
    });

    this.map.addLayer(layer);

    this.dirtyAnomsLayers.push(layer);
    this.dirtyAnomsLayers$.next(this.dirtyAnomsLayers);
  }

  addDirtyAnoms(informeId: string) {
    const anomsInforme = this.reportControlService.dirtyAnoms.filter((anom) => anom.informeId === informeId);

    anomsInforme.forEach((anom) => {
      this.addDirtyAnom(anom);
    });
  }

  private addDirtyAnom(anom: Anomalia) {
    const feature = new Feature({
      geometry: new Polygon([anom.featureCoords]),
      properties: {
        id: anom.id,
        name: 'dirtyAnom',
      },
    });

    this.dirtyAnomsSource.addFeature(feature);
  }

  private addOnHoverDirtyAnomsAction() {
    let currentFeatureHover: Feature<any>;
    this.map.on('pointermove', (event) => {
      let foundFeature = false;

      if (currentFeatureHover !== undefined) {
        currentFeatureHover.setStyle(this.getStyleDirtyAnom(false));
        currentFeatureHover = undefined;
      }

      this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const f = feature as Feature<any>;

        if (f.getProperties().properties.name === 'dirtyAnom') {
          foundFeature = true;
          currentFeatureHover = f;
          currentFeatureHover.setStyle(this.getStyleDirtyAnom(true));

          const anom = this.reportControlService.dirtyAnoms.find((anom) => anom.id === f.getProperties().properties.id);

          this.map.getOverlayById('popup-dirty').setPosition(anom.featureCoords[0]);
        }
      });

      if (!foundFeature) {
        if (currentFeatureHover !== undefined) {
          currentFeatureHover.setStyle(this.getStyleDirtyAnom(false));
          currentFeatureHover = undefined;
        }
        this.map.getOverlayById('popup-dirty').setPosition(undefined);
      }
    });
  }

  private getStyleDirtyAnom(hovered: boolean) {
    if (hovered) {
      return (feature: Feature<any>) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              width: 2,
              color: 'white',
              lineDash: [5],
            }),
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)',
            }),
          });
        }
      };
    } else {
      return (feature: Feature<any>) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              width: 1,
              color: 'white',
              lineDash: [5],
            }),
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0)',
            }),
          });
        }
      };
    }
  }

  resetService() {
    this.subscriptions.unsubscribe();
  }
}
