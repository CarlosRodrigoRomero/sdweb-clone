import { Component, OnInit } from '@angular/core';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import { MapControlService } from '../../services/map-control.service';
import { OlMapService } from '@core/services/ol-map.service';

@Component({
  selector: 'app-slider-temporal',
  templateUrl: './slider-temporal.component.html',
  styleUrls: ['./slider-temporal.component.scss'],
})
export class SliderTemporalComponent implements OnInit {
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  public selectedInformeId: string;
  private informesList: string[];

  /* Slider Año */
  currentYear = 100;
  dates = ['Jul 2019', 'Jun 2020'];
  optionsTemporalSlider: Options = {
    floor: 0,
    ceil: 100,
    showTicksValues: true,
    step: 100,
    translate: (value: number, label: LabelType): string => {
      return this.dates[value / 100];
    },
  };

  constructor(private mapControlService: MapControlService, private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];

    this.mapControlService.selectedInformeId$.subscribe((informeID) => (this.selectedInformeId = informeID));

    this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers));
    this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers));

    // Slider temporal cambio de año
    this.mapControlService.sliderTemporalSource.subscribe((v) => {
      this.thermalLayers[1].setOpacity(v / 100); // 2020
      this.anomaliaLayers[1].setOpacity(v / 100);
      this.anomaliaLayers[0].setOpacity(1 - v / 100);
      this.thermalLayers[0].setOpacity(1 - v / 100); // 2019
      // this.thermalLayers.forEach(layer => {
      //   layer.setOpacity(v / 100);
      // })
      if (v >= 50) {
        this.selectedInformeId = this.informesList[1];
      } else {
        this.selectedInformeId = this.informesList[0];
      }
    });
  }

  onChangeTemporalSlider(value: number) {
    this.mapControlService.sliderTemporal = value;
    const roundedValue = Math.round(value / 100);
    this.mapControlService.selectedInformeId = this.informesList[roundedValue];
  }
}
