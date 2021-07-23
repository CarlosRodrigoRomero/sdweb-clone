import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { InformeService } from '@core/services/informe.service';
import { ReportControlService } from '@core/services/report-control.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';

@Component({
  selector: 'app-seguidor-slider-temporal',
  templateUrl: './seguidor-slider-temporal.component.html',
  styleUrls: ['./seguidor-slider-temporal.component.scss'],
})
export class SeguidorSliderTemporalComponent implements OnInit, OnDestroy {
  public selectedInformeId: string;
  public informeIdList: string[];
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

  private subscriptions: Subscription = new Subscription();

  constructor(
    private mapSeguidoresService: MapSeguidoresService,
    private informeService: InformeService,
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.informesIdList$
        .pipe(
          take(1),
          switchMap((informesId) => {
            this.informeIdList = informesId;

            return this.informeService.getDateLabelsInformes(informesId);
          })
        )
        .subscribe((dates) => {
          this.dates = dates;

          // ya tenemos los labels y ahora mostramos el slider
          this.sliderLoaded = true;
        })
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.currentYear = this.informeIdList.indexOf(this.selectedInformeId) * 100;

    this.subscriptions.add(
      this.mapSeguidoresService.sliderTemporalSelected$.subscribe((value) => (this.currentYear = value))
    );
  }

  onChangeTemporalSlider(value: number) {
    this.mapSeguidoresService.sliderTemporalSelected = value;

    const roundedValue = Math.round(value / (100 / (this.informeIdList.length - 1)));

    this.reportControlService.selectedInformeId = this.informeIdList[roundedValue];

    // cambiamos al mismo seguidor pero del informe actual
    this.seguidoresControlService.changeInformeSeguidorSelected();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
