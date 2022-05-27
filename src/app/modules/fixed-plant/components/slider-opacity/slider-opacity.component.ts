import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

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
export class SliderOpacityComponent implements OnInit {
  private thermalLayers: TileLayer[];
  private selectedInformeId: string;

  constructor(
    private mapControlService: MapControlService,
    private reportControlService: ReportControlService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.olMapService
      .getThermalLayers()
      .pipe(
        take(1),
        switchMap((layers) => {
          this.thermalLayers = layers;

          return this.mapControlService.sliderThermalOpacitySource;
        })
      )
      .subscribe((v) => {
        this.thermalLayers.forEach((layer) => {
          if (layer.getProperties().informeId === this.selectedInformeId) {
            layer.setOpacity(v / 100);
          } else {
            layer.setOpacity(0);
          }
        });
      });

    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInformeId = informeId;
      // retrasamos 100ms para que se actualice despues de la capa térmica
      setTimeout(() => {
        const valueSlider = this.mapControlService.sliderThermalOpacity;
        this.thermalLayers.forEach((layer) => {
          if (layer.getProperties().informeId === this.selectedInformeId) {
            layer.setOpacity(valueSlider / 100);
          } else {
            layer.setOpacity(0);
          }
        });
      }, 100);
    });

    // nos subscribimos a los valores del slider
    this.mapControlService.sliderThermalOpacitySource.subscribe((v) => {
      this.thermalLayers.forEach((layer) => {
        if (layer.getProperties().informeId === this.selectedInformeId) {
          layer.setOpacity(v / 100);
        } else {
          layer.setOpacity(0);
        }
      });
    });
  }

  onChangeThermalOpacitySlider(e: MatSliderChange) {
    this.mapControlService.sliderThermalOpacity = e.value;
  }
}
