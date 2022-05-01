import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';

import { MapControlService } from '../../services/map-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { OlMapService } from '@data/services/ol-map.service';

@Component({
  selector: 'app-slider-opacity',
  templateUrl: './slider-opacity.component.html',
  styleUrls: ['./slider-opacity.component.scss'],
})
export class SliderOpacityComponent implements OnInit {
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  private selectedInformeId: string;

  constructor(
    private mapControlService: MapControlService,
    private reportControlService: ReportControlService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.reportControlService.selectedInformeId$.subscribe((informeID) => (this.selectedInformeId = informeID));

    this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers));
    this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers));

    this.mapControlService.sliderThermalOpacitySource.subscribe((v) => {
      this.thermalLayers.forEach((layer) => {
        if (layer.getProperties().informeId === this.selectedInformeId) {
          layer.setOpacity(v / 100);
        } else {
          layer.setOpacity(0);
        }
      });
      /* this.anomaliaLayers.forEach((layer) => {
        if (layer.getProperties().informeId === this.selectedInformeId) {
          layer.setOpacity(v / 100);
        } else {
          layer.setOpacity(0);
        }
      }); */
    });
  }

  onChangeThermalOpacitySlider(e: MatSliderChange) {
    this.mapControlService.sliderThermalOpacity = e.value;
  }
}
