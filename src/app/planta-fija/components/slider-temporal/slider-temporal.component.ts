import { Component, OnDestroy, OnInit } from '@angular/core';

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import { MapControlService } from '../../services/map-control.service';
import { OlMapService } from '@core/services/ol-map.service';
import { InformeService } from '@core/services/informe.service';
import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-slider-temporal',
  templateUrl: './slider-temporal.component.html',
  styleUrls: ['./slider-temporal.component.scss'],
})
export class SliderTemporalComponent implements OnInit, OnDestroy {
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  public selectedInformeId: string;
  private informesList: string[];
  private sliderLoaded = false;
  public sliderLoaded$ = new BehaviorSubject<boolean>(this.sliderLoaded);
  private subscriptions: Subscription = new Subscription();

  /* Slider Values*/
  currentYear = 100;
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
    private informeService: InformeService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.reportControlService.informesIdList$.pipe(take(1)).subscribe((informesId) => {
      this.informesList = informesId;
      this.subscriptions.add(
        this.getDatesInformes(informesId).subscribe((dates) => {
          this.dates = dates;

          // ya tenemos los labels y ahora mostramos el slider
          this.sliderLoaded = true;
          this.sliderLoaded$.next(this.sliderLoaded);
        })
      );
    });

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.currentYear = this.informesList.indexOf(this.selectedInformeId) * 100;

    this.mapControlService.sliderTemporal = this.currentYear;

    this.subscriptions.add(
      combineLatest([this.olMapService.getThermalLayers(), this.olMapService.getAnomaliaLayers()]).subscribe(
        ([tLayers, aLayers]) => {
          this.thermalLayers = tLayers;
          this.anomaliaLayers = aLayers;

          this.setThermalLayersOpacity(this.selectedInformeId);
          this.setAnomaliaLayersOpacity(this.selectedInformeId);
        }
      )
    );
  }

  onChangeTemporalSlider(value: number) {
    this.mapControlService.sliderTemporal = value;

    const roundedValue = Math.round(value / (100 / (this.informesList.length - 1)));

    this.reportControlService.selectedInformeId = this.informesList[roundedValue];

    this.setThermalLayersOpacity(this.informesList[roundedValue]);
    this.setAnomaliaLayersOpacity(this.informesList[roundedValue]);
  }

  setThermalLayersOpacity(informeId: string) {
    this.thermalLayers.forEach((layer, index) => {
      if (index === this.informesList.indexOf(informeId)) {
        layer.setOpacity(1);
      } else {
        layer.setOpacity(0);
      }
    });
  }

  setAnomaliaLayersOpacity(informeId: string) {
    this.anomaliaLayers.forEach((layer, index) => {
      if (index === this.informesList.indexOf(informeId)) {
        layer.setOpacity(1);
      } else {
        layer.setOpacity(0);
      }
    });
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

  ngOnDestroy(): void {
    console.log('ok');
    this.subscriptions.unsubscribe();
  }
}
