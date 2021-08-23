import { Component, OnDestroy, OnInit } from '@angular/core';

import { combineLatest, Subscription } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import TileLayer from 'ol/layer/Tile';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { InformeService } from '@core/services/informe.service';
import { ReportControlService } from '@core/services/report-control.service';
import { OlMapService } from '@core/services/ol-map.service';

@Component({
  selector: 'app-slider-temporal',
  templateUrl: './slider-temporal.component.html',
  styleUrls: ['./slider-temporal.component.scss'],
})
export class SliderTemporalComponent implements OnInit, OnDestroy {
  public selectedInformeId: string;
  public informesIdList: string[];
  public sliderLoaded = false;
  private aerialLayers: TileLayer[];

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
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.informesIdList$
        .pipe(
          take(1),
          switchMap((informesId) => {
            this.informesIdList = informesId;

            return this.getDatesInformes(informesId);
          })
        )
        .subscribe((dates) => {
          this.dates = dates;

          // ya tenemos los labels y ahora mostramos el slider
          this.sliderLoaded = true;
        })
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeID) => (this.selectedInformeId = informeID))
    );

    this.currentYear = this.informesIdList.indexOf(this.selectedInformeId) * 100;

    this.subscriptions.add(
      this.mapSeguidoresService.sliderTemporalSelected$.subscribe((value) => (this.currentYear = value))
    );

    this.olMapService
      .getAerialLayers()
      .pipe(take(1))
      .subscribe((aerialLayers) => {
        this.aerialLayers = aerialLayers;

        this.setAerialLayersOpacity(this.selectedInformeId);
      });
  }

  onChangeTemporalSlider(value: number) {
    this.mapSeguidoresService.sliderTemporalSelected = value;

    const roundedValue = Math.round(value / (100 / (this.informesIdList.length - 1)));

    this.reportControlService.selectedInformeId = this.informesIdList[roundedValue];

    this.setAerialLayersOpacity(this.informesIdList[roundedValue]);
  }

  private setAerialLayersOpacity(informeId: string) {
    this.aerialLayers.forEach((layer, index) => {
      if (index === this.informesIdList.indexOf(informeId)) {
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
    this.subscriptions.unsubscribe();
  }
}
