import { Component, OnInit } from '@angular/core';

import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import VectorLayer from 'ol/layer/Vector';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { OlMapService } from '@core/services/ol-map.service';
import { InformeService } from '@core/services/informe.service';

@Component({
  selector: 'app-slider-temporal',
  templateUrl: './slider-temporal.component.html',
  styleUrls: ['./slider-temporal.component.scss'],
})
export class SliderTemporalComponent implements OnInit {
  private seguidorLayers: VectorLayer[];
  public selectedInformeId: string;
  private informesList: string[];
  private sliderLoaded = false;
  public sliderLoaded$ = new BehaviorSubject<boolean>(this.sliderLoaded);

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
    private olMapService: OlMapService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    this.mapSeguidoresService.getInformesList().subscribe((informesId) => {
      this.informesList = informesId;
      this.getDatesInformes(informesId).subscribe((dates) => {
        this.dates = dates;

        // ya tenemos los labels y ahora mostramos el slider
        this.sliderLoaded = true;
        this.sliderLoaded$.next(this.sliderLoaded);
      });
    });

    this.mapSeguidoresService.selectedInformeId$.subscribe((informeID) => (this.selectedInformeId = informeID));

    this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers));

    const sliderTemporalSource = this.mapSeguidoresService.getSliderTemporalSource();
    const viewToggle = this.mapSeguidoresService.getToggleView();

    // Slider temporal cambio de año
    combineLatest([sliderTemporalSource, viewToggle]).subscribe(([sliderTempValue, viewToggValue]) => {
      // ocultamos todas las capas se seguidores
      this.seguidorLayers.forEach((layer) => layer.setOpacity(0));

      // mostramos la seleccionada por ambos selectores
      const index = Number(viewToggValue) + Number(3 * (sliderTempValue / (100 / (this.informesList.length - 1))));
      this.seguidorLayers[index].setOpacity(1);

      // TODO no funciona para más de 2 informes
      if (sliderTempValue >= 50) {
        this.selectedInformeId = this.informesList[1];
      } else {
        this.selectedInformeId = this.informesList[0];
      }
    });
  }

  onChangeTemporalSlider(value: number) {
    this.mapSeguidoresService.sliderTemporal = value;
    const roundedValue = Math.round(value / (100 / (this.informesList.length - 1)));
    this.mapSeguidoresService.selectedInformeId = this.informesList[roundedValue];
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
