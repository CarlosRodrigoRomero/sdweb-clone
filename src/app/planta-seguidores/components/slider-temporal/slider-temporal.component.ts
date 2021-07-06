import { Component, OnInit } from '@angular/core';

import { combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { InformeService } from '@core/services/informe.service';
import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-slider-temporal',
  templateUrl: './slider-temporal.component.html',
  styleUrls: ['./slider-temporal.component.scss'],
})
export class SliderTemporalComponent implements OnInit {
  public selectedInformeId: string;
  public informesList: string[];
  public sliderLoaded = false;

  /* Slider Values */
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
    private mapSeguidoresService: MapSeguidoresService,
    private informeService: InformeService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.reportControlService.informesIdList$.pipe(take(1)).subscribe((informesId) => {
      this.informesList = informesId;
      this.getDatesInformes(informesId).subscribe((dates) => {
        this.dates = dates;

        // ya tenemos los labels y ahora mostramos el slider
        this.sliderLoaded = true;
      });
    });

    this.reportControlService.selectedInformeId$.subscribe((informeID) => (this.selectedInformeId = informeID));

    this.currentYear = this.informesList.indexOf(this.selectedInformeId) * 100;

    this.mapSeguidoresService.sliderTemporalSelected$.subscribe((value) => (this.currentYear = value));
  }

  onChangeTemporalSlider(value: number) {
    this.mapSeguidoresService.sliderTemporalSelected = value;

    const roundedValue = Math.round(value / (100 / (this.informesList.length - 1)));

    this.reportControlService.selectedInformeId = this.informesList[roundedValue];
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
