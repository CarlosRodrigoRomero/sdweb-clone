import { Component, OnDestroy, OnInit } from '@angular/core';

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { InformeService } from '@data/services/informe.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-slider-temporal',
  templateUrl: './slider-temporal.component.html',
  styleUrls: ['./slider-temporal.component.scss'],
})
export class SliderTemporalComponent implements OnInit, OnDestroy {
  public selectedInformeId: string;
  private informesIdList: string[];
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
    private informeService: InformeService,
    private reportControlService: ReportControlService,
    private viewReportService: ViewReportService
  ) {}

  ngOnInit(): void {
    this.informesIdList = this.reportControlService.informesIdList;

    this.subscriptions.add(
      this.getDatesInformes(this.informesIdList).subscribe((dates) => {
        this.dates = dates;

        // ya tenemos los labels y ahora mostramos el slider
        this.sliderLoaded = true;
        this.sliderLoaded$.next(this.sliderLoaded);
      })
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.currentYear = this.informesIdList.indexOf(this.selectedInformeId) * 100;

    this.viewReportService.sliderTemporal = this.currentYear;
  }

  onChangeTemporalSlider(value: number) {
    this.viewReportService.sliderTemporal = value;

    const roundedValue = Math.round(value / (100 / (this.informesIdList.length - 1)));

    this.reportControlService.selectedInformeId = this.informesIdList[roundedValue];
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
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const month = monthNames[date.getMonth()];
    return month + ' ' + year;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
