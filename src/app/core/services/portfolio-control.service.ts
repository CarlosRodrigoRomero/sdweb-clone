import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { PlantaInterface } from '@core/models/planta';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root',
})
export class PortfolioControlService {
  private _plantaHover: PlantaInterface = undefined;
  public plantaHover$ = new BehaviorSubject<PlantaInterface>(this._plantaHover);
  private _maeMedio: number = undefined;
  public maeMedio$ = new BehaviorSubject<number>(this._maeMedio);
  private _maeSigma: number = undefined;
  public maeSigma$ = new BehaviorSubject<number>(this._maeSigma);

  constructor() {}

  public getColorMae(mae: number, opacity?: number): string {
    if (opacity !== undefined) {
      if (mae >= this.maeMedio + this.maeSigma) {
        return GLOBAL.colores_mae_rgb[2].replace(',1)', ',' + opacity + ')');
      } else if (mae <= this.maeMedio - this.maeSigma) {
        return GLOBAL.colores_mae_rgb[0].replace(',1)', ',' + opacity + ')');
      } else {
        return GLOBAL.colores_mae_rgb[1].replace(',1)', ',' + opacity + ')');
      }
    } else {
      if (mae >= this.maeMedio + this.maeSigma) {
        return GLOBAL.colores_mae_rgb[2];
      } else if (mae <= this.maeMedio - this.maeSigma) {
        return GLOBAL.colores_mae_rgb[0];
      } else {
        return GLOBAL.colores_mae_rgb[1];
      }
    }
  }

  get anomaliaHover() {
    return this._plantaHover;
  }

  set anomaliaHover(value: PlantaInterface) {
    this._plantaHover = value;
    this.plantaHover$.next(value);
  }

  get maeMedio() {
    return this._maeMedio;
  }

  set maeMedio(value: number) {
    this._maeMedio = value;
    this.maeMedio$.next(value);
  }

  get maeSigma() {
    return this._maeSigma;
  }

  set maeSigma(value: number) {
    this._maeSigma = value;
    this.maeSigma$.next(value);
  }
}
