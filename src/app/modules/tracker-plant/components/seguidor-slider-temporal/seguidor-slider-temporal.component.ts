import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { InformeService } from '@data/services/informe.service';
import { ReportControlService } from '@data/services/report-control.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';

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
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService
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
    this.seguidorViewService.sliderTemporalSelected = value;

    // reiniamos las imagenes
    this.resetImages();

    const roundedValue = Math.round(value / (100 / (this.informeIdList.length - 1)));

    const newInformeId = this.informeIdList[roundedValue];

    this.seguidorViewService.selectedInformeId = newInformeId;

    // cambiamos al mismo seguidor pero del nuevo informe seleccionado
    this.seguidoresControlService.changeInformeSeguidorSelected(newInformeId);
  }

  resetImages() {
    // limpiamos la imagen del seguidor anterior
    this.seguidorViewService.thermalCanvas.clear();
    this.seguidorViewService.visualCanvas.clear();

    // limpiamos las url para que no se muestre la imagen anterior al pasar
    this.seguidoresControlService.urlThermalImageSeguidor = undefined;
    this.seguidoresControlService.urlVisualImageSeguidor = undefined;

    // reiniciamos la carga de la nueva imagen
    this.seguidorViewService.imagesLoaded = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
