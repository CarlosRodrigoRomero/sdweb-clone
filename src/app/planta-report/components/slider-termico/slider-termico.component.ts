import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import { OlMapService } from '@core/services/ol-map.service';
import { MapControlService } from '../../services/map-control.service';
import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-slider-termico',
  templateUrl: './slider-termico.component.html',
  styleUrls: ['./slider-termico.component.scss'],
})
export class SliderTermicoComponent implements OnInit {
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  public selectedInformeId: string;

  /* Slider Temperatura */
  lowTemp = 25;
  highTemp = 75;
  optionsTemp: Options = {
    floor: 25,
    ceil: 100,
    translate: (value: number, label: LabelType): string => {
      switch (label) {
        case LabelType.Low:
          return '<b>' + value + '</b> ºC';
        case LabelType.High:
          return '<b>' + value + '</b> ºC';
        default:
          return value + 'ºC';
      }
    },
  };

  constructor(
    private mapControlService: MapControlService,
    private olMapService: OlMapService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.reportControlService.selectedInformeId$.subscribe((informeID) => (this.selectedInformeId = informeID));

    this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers));
    this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers));

    // Slider rango de temperatura
    this.mapControlService.sliderMaxSource.subscribe(() => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
    this.mapControlService.sliderMinSource.subscribe(() => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });

    // Slider opacidad
    this.mapControlService.sliderThermalOpacitySource.subscribe((v) => {
      this.thermalLayers.forEach((layer) => {
        if (layer.getProperties().informeId === this.selectedInformeId) {
          layer.setOpacity(v / 100);
        } else {
          layer.setOpacity(0);
        }
        // TODO
        // const val = v/100;

        // const dif = layer.getOpacity()-v/100
      });
      this.anomaliaLayers.forEach((layer) => {
        if (layer.getProperties().informeId === this.selectedInformeId) {
          layer.setOpacity(v / 100);
        } else {
          layer.setOpacity(0);
        }
      });
    });
  }

  onChangeTemperatureSlider(lowValue: number, highValue: number) {
    this.mapControlService.sliderMax = highValue;
    this.mapControlService.sliderMin = lowValue;
  }

  onChangeThermalOpacitySlider(e: MatSliderChange) {
    this.mapControlService.sliderThermalOpacity = e.value;
  }
}
