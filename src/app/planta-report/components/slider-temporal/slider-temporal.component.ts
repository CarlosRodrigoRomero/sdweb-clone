import { Component, OnInit } from '@angular/core';

import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import { MapControlService } from '../../services/map-control.service';
import { OlMapService } from '@core/services/ol-map.service';
import { InformeService } from '@core/services/informe.service';

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
  private sliderLoaded = false;
  public sliderLoaded$ = new BehaviorSubject<boolean>(this.sliderLoaded);

  /* Slider Values*/
  currentYear = 100;
  // dates = ['Jul 2019', 'Jun 2020'];
  dates: string[] = [];
  optionsTemporalSlider: Options = {
    floor: 0,
    ceil: 100,
    showTicksValues: true,
    step: 100,
    translate: (value: number, label: LabelType): string => {
      return this.dates[value / 100];
    },
  };

  constructor(
    private mapControlService: MapControlService,
    private olMapService: OlMapService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    // this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];
    this.mapControlService.informesList$.subscribe((informesId) => {
      this.informesList = informesId;
      this.getDatesInformes(informesId).subscribe((dates) => {
        this.dates = dates;

        // ya tenemos los labels y ahora mostramos el slider
        this.sliderLoaded = true;
        this.sliderLoaded$.next(this.sliderLoaded);
      });
    });

    this.mapControlService.selectedInformeId$.subscribe((informeID) => (this.selectedInformeId = informeID));

    combineLatest([this.olMapService.getThermalLayers(), this.olMapService.getAnomaliaLayers()]).subscribe(
      ([tLayers, aLayers]) => {
        this.thermalLayers = tLayers;
        this.anomaliaLayers = aLayers;

        // Slider temporal cambio de año
        this.mapControlService.sliderTemporalSource.subscribe((sliderValue) => {
          this.thermalLayers.forEach((layer, index, layers) => {
            if (index === layers.length - 1) {
              layer.setOpacity(sliderValue / 100);
            } else {
              layer.setOpacity(1 - sliderValue / 100);
            }
          });
          this.anomaliaLayers.forEach((layer, index, layers) => {
            if (index === layers.length - 1) {
              layer.setOpacity(sliderValue / 100);
            } else {
              layer.setOpacity(1 - sliderValue / 100);
            }
          });

          // TODO no funciona para más de 2 informes
          if (sliderValue >= 50) {
            this.selectedInformeId = this.informesList[1];
          } else {
            this.selectedInformeId = this.informesList[0];
          }
        });
      }
    );
  }

  onChangeTemporalSlider(value: number) {
    this.mapControlService.sliderTemporal = value;
    const roundedValue = Math.round(value / (100 / (this.informesList.length - 1)));
    this.mapControlService.selectedInformeId = this.informesList[roundedValue];
  }

  getDatesInformes(informesId: string[]) {
    return combineLatest(
      informesId.map((informeId) =>
        this.informeService.getInforme(informeId).pipe(
          take(1),
          map((informe) => this.unixToDateLabel(informe.fecha))
        )
      )
    );
  }

  unixToDateLabel(unix: number): string {
    const date = new Date(unix * 1000);
    const year = date.getFullYear();
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const month = monthNames[date.getMonth()];
    return month + ' ' + year;
  }
}
