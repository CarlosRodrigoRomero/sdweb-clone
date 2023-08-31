import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewCommentsService } from '@data/services/view-comments.service';

@Component({
  selector: 'app-map-view-control',
  templateUrl: './map-view-control.component.html',
  styleUrls: ['./map-view-control.component.css'],
})
export class MapViewControlComponent implements OnInit, OnDestroy {
  private thermalLayer: TileLayer<any>;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private viewCommentsService: ViewCommentsService
  ) {}

  ngOnInit(): void {
    // cambiamos el zoom para fijas
    if (this.reportControlService.plantaNoS2E) {
      this.viewCommentsService.zoomShowAnoms = 20;
    }

    if (this.reportControlService.plantaNoS2E) {
      this.subscriptions.add(
        this.olMapService
          .getThermalLayers()
          .pipe(
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
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
