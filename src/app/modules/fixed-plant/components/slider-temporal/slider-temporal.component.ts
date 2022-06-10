import { Component, OnDestroy, OnInit } from '@angular/core';

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import { MapControlService } from '../../services/map-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { InformeService } from '@data/services/informe.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-slider-temporal',
  templateUrl: './slider-temporal.component.html',
  styleUrls: ['./slider-temporal.component.scss'],
})
export class SliderTemporalComponent implements OnInit, OnDestroy {
  private thermalLayers: TileLayer[];
  private aerialLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];
  private seguidorLayers: VectorLayer[];
  public selectedInformeId: string;
  private informesIdList: string[];
  private sliderLoaded = false;
  public sliderLoaded$ = new BehaviorSubject<boolean>(this.sliderLoaded);
  private reportViewSelected: number;

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
    private reportControlService: ReportControlService,
    private viewReportService: ViewReportService
  ) {}

  ngOnInit(): void {
    this.reportControlService.informesIdList$.pipe(take(1)).subscribe((informesId) => {
      this.informesIdList = informesId;
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
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInformeId = informeId;

        this.setThermalLayersOpacity(this.selectedInformeId);
        // this.setAerialLayersOpacity(this.selectedInformeId);

        if (this.anomaliaLayers !== undefined) {
          this.setAnomaliaLayersOpacity(this.selectedInformeId);
        }
        // if (this.seguidorLayers !== undefined) {
        //   this.setSeguidorLayersOpacity(this.selectedInformeId);
        // }
      })
    );

    this.currentYear = this.informesIdList.indexOf(this.selectedInformeId) * 100;

    this.mapControlService.sliderTemporal = this.currentYear;

    this.subscriptions.add(
      combineLatest([
        this.olMapService.getThermalLayers(),
        // this.olMapService.aerialLayers$,
        this.olMapService.getAnomaliaLayers(),
        // this.olMapService.getSeguidorLayers(),
      ]).subscribe(([thermalLayers, /* aerialLayers, */ anomLayers, /* segLayers */]) => {
        this.thermalLayers = thermalLayers;
        // this.aerialLayers = aerialLayers;

        if (anomLayers.length > 0) {
          this.anomaliaLayers = anomLayers;
          this.setAnomaliaLayersOpacity(this.selectedInformeId);
        }
        // if (segLayers.length > 0) {
        //   this.seguidorLayers = segLayers;
        //   this.setSeguidorLayersOpacity(this.selectedInformeId);
        // }

        this.setThermalLayersOpacity(this.selectedInformeId);
        // this.setAerialLayersOpacity(this.selectedInformeId);
      })
    );

    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((view) => (this.reportViewSelected = view))
    );
  }

  onChangeTemporalSlider(value: number) {
    this.mapControlService.sliderTemporal = value;

    const roundedValue = Math.round(value / (100 / (this.informesIdList.length - 1)));

    this.reportControlService.selectedInformeId = this.informesIdList[roundedValue];
  }

  setThermalLayersOpacity(informeId: string) {
    this.thermalLayers.forEach((layer, index) => {
      if (index === this.informesIdList.indexOf(informeId)) {
        layer.setOpacity(1);
      } else {
        layer.setOpacity(0);
      }
    });
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

  setAnomaliaLayersOpacity(informeId: string) {
    this.anomaliaLayers.forEach((layer, index) => {
      if (index === this.informesIdList.indexOf(informeId)) {
        layer.setOpacity(1);
      } else {
        layer.setOpacity(0);
      }
    });
  }

  private setSeguidorLayersOpacity(informeId: string) {
    this.seguidorLayers.forEach((layer) => {
      if (layer.getProperties().informeId === informeId && layer.getProperties().view === this.reportViewSelected) {
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
