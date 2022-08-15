import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewCommentsService } from '@data/services/view-comments.service';
import { ZonesService } from '@data/services/zones.service';

@Component({
  selector: 'app-map-view-control',
  templateUrl: './map-view-control.component.html',
  styleUrls: ['./map-view-control.component.css'],
})
export class MapViewControlComponent implements OnInit {
  private anomaliaLayers: VectorLayer[];
  private seguidorLayers: VectorLayer[];
  private zonesLayers: VectorLayer[];
  private thermalLayer: TileLayer;
  private currentZoom: number;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private viewCommentsService: ViewCommentsService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    // cambiamos el zoom para fijas
    if (this.reportControlService.plantaFija) {
      this.viewCommentsService.zoomChangeView = 20;
    }

    if (this.reportControlService.plantaFija) {
      this.subscriptions.add(
        this.olMapService
          .getThermalLayers()
          .pipe(
            take(1),
            switchMap((layers) => {
              this.thermalLayer = layers[0];

              return this.viewCommentsService.thermalLayerVisible$;
            })
          )
          .subscribe((visible) => {
            if (this.thermalLayer !== undefined) {
              this.thermalLayer.setVisible(visible);
            }
          })
      );

      this.subscriptions.add(
        this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers))
      );
    } else {
      this.subscriptions.add(
        this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers))
      );
    }

    this.subscriptions.add(this.olMapService.zonasLayers$.subscribe((layers) => (this.zonesLayers = layers)));

    if (this.zonesService.thereAreZones) {
      this.subscriptions.add(
        this.olMapService.currentZoom$.subscribe((zoom) => {
          this.currentZoom = zoom;

          this.setLayersVisibility();
        })
      );
    }

    // establecemos las visibilidades de inicio cuando el mapa ha cargado
    this.subscriptions.add(
      this.reportControlService.mapLoaded$.subscribe((loaded) => {
        if (loaded) {
          this.setLayersVisibility();
        }
      })
    );
  }

  private setLayersVisibility() {
    if (this.reportControlService.plantaFija !== undefined) {
      if (this.reportControlService.plantaFija) {
        this.setAnomaliaLayersVisibility();
      } else {
        this.setSeguidorLayersVisibility();
      }
    }
  }

  private setAnomaliaLayersVisibility() {
    this.anomaliaLayers.forEach((layer) => {
      if (this.zonesService.thereAreZones) {
        if (this.currentZoom >= this.viewCommentsService.zoomChangeView) {
          layer.setVisible(true);
        } else {
          layer.setVisible(false);
        }
      } else {
        layer.setVisible(true);
      }
    });
  }

  private setSeguidorLayersVisibility() {
    this.seguidorLayers.forEach((layer) => {
      if (this.zonesService.thereAreZones) {
        if (this.currentZoom >= this.viewCommentsService.zoomChangeView) {
          layer.setVisible(true);
        } else {
          layer.setVisible(false);
        }
      } else {
        layer.setVisible(true);
      }
    });
  }
}
