import { Component, OnDestroy, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';

import { MapControlService } from '../../services/map-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-slider-opacity',
  templateUrl: './slider-opacity.component.html',
  styleUrls: ['./slider-opacity.component.scss'],
})
export class SliderOpacityComponent implements OnInit, OnDestroy {
  private thermalLayers: TileLayer<any>[];
  private selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private mapControlService: MapControlService,
    private reportControlService: ReportControlService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.olMapService
        .getThermalLayers()
        .pipe(
          switchMap((layers) => {
            this.thermalLayers = layers;

            return this.reportControlService.selectedInformeId$;
          }),
          switchMap((informeId) => {
            this.selectedInformeId = informeId;

            return this.mapControlService.sliderThermalOpacitySource;
          })
        )
        .subscribe((v) => {
          this.thermalLayers.forEach((layer) => {
            // retrasamos 100ms para que sea posterior a la carga de la thermal
            setTimeout(() => {
              layer.setOpacity(v / 100);

              if (layer.getProperties().informeId === this.selectedInformeId) {
                layer.setVisible(true);
              } else {
                layer.setVisible(false);
              }
            }, 100);
          });
        })
    );
  }

  onChangeThermalOpacitySlider(e: MatSliderChange) {
    this.mapControlService.sliderThermalOpacity = e.value;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    this.mapControlService.resetService();
  }
}
