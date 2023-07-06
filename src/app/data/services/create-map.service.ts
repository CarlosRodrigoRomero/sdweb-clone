import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { InformeService } from './informe.service';
import { PlantaService } from './planta.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

@Injectable({
  providedIn: 'root',
})
export class CreateMapService {
  private informeId: string;
  planta: PlantaInterface;
  informe: InformeInterface;
  private _createMode = false;
  createMode$ = new BehaviorSubject<boolean>(this._createMode);
  private _sliderMin: number = 30;
  sliderMin$ = new BehaviorSubject<number>(this._sliderMin);
  private _sliderMax: number = 90;
  sliderMax$ = new BehaviorSubject<number>(this._sliderMax);

  constructor(private router: Router, private informeService: InformeService, private plantaService: PlantaService) {}

  initService(): Promise<boolean> {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    return new Promise((initService) => {
      this.informeService
        .getInforme(this.informeId)
        .pipe(
          take(1),
          switchMap((informe) => {
            this.informe = informe;

            return this.plantaService.getPlanta(informe.plantaId);
          })
        )
        .subscribe((planta) => {
          this.planta = planta;

          initService(true);
        });
    });
  }

  resetService() {
    this.informeId = undefined;
    this.planta = undefined;
    this.informe = undefined;
    this.createMode = false;
    this.sliderMin = 30;
    this.sliderMax = 90;
  }

  ////////////////////////////////////////////////////////////

  get createMode(): boolean {
    return this._createMode;
  }

  set createMode(value: boolean) {
    this._createMode = value;
    this.createMode$.next(value);
  }

  get sliderMin() {
    return this._sliderMin;
  }

  set sliderMin(value: number) {
    this._sliderMin = value;
    this.sliderMin$.next(value);
  }

  get sliderMax() {
    return this._sliderMax;
  }

  set sliderMax(value: number) {
    this._sliderMax = value;
    this.sliderMax$.next(value);
  }
}
