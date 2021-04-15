import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';
import { GLOBAL } from './global';
import { UserInterface } from '@core/models/user';
import { switchMap } from 'rxjs/operators';
import { Feature } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';

@Injectable({
  providedIn: 'root',
})
export class PortfolioControlService {
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _plantaHover: PlantaInterface = undefined;
  public plantaHover$ = new BehaviorSubject<PlantaInterface>(this._plantaHover);
  private _maeMedio: number = undefined;
  public maeMedio$ = new BehaviorSubject<number>(this._maeMedio);
  private _maeSigma: number = undefined;
  public maeSigma$ = new BehaviorSubject<number>(this._maeSigma);
  public numPlantas = 0;
  public potenciaTotal = 0;
  public listaPlantas: PlantaInterface[] = [];
  public allFeatures: Feature[] = [];

  constructor(public auth: AuthService, private plantaService: PlantaService) {}

  public initService(): Observable<boolean> {
    this.auth.user$.pipe(switchMap((user) => this.plantaService.getPlantasDeEmpresa(user))).subscribe((plantas) => {
      plantas.forEach((planta) => {
        if (planta.informes !== undefined && planta.informes.length > 0) {
          const mae = planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae;
          // comprobamos que el informe tiene "mae"
          if (mae !== undefined) {
            this.listaPlantas.push(planta);

            this.numPlantas++;
            this.potenciaTotal += planta.potencia;
          }
        }
      });
      const maePlantas = this.listaPlantas.map(
        (planta) => planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae
      );
      this.maeMedio = this.average(maePlantas);
      // this.maeSigma = this.standardDeviation(maePlantas);
      this.maeSigma = this.standardDeviation(maePlantas) / 3; // DEMO

      this.initialized$.next(true);
    });

    return this.initialized$;
  }

  public getColorMae(mae: number, opacity?: number): string {
    if (opacity !== undefined) {
      if (mae > this.maeMedio + this.maeSigma) {
        return GLOBAL.colores_mae_rgb[2].replace(',1)', ',' + opacity + ')');
      } else if (mae <= this.maeMedio - this.maeSigma) {
        return GLOBAL.colores_mae_rgb[0].replace(',1)', ',' + opacity + ')');
      } else {
        return GLOBAL.colores_mae_rgb[1].replace(',1)', ',' + opacity + ')');
      }
    } else {
      if (mae > this.maeMedio + this.maeSigma) {
        return GLOBAL.colores_mae_rgb[2];
      } else if (mae <= this.maeMedio - this.maeSigma) {
        return GLOBAL.colores_mae_rgb[0];
      } else {
        return GLOBAL.colores_mae_rgb[1];
      }
    }
  }

  public setExternalStyle(plantaId: string, focus: boolean) {
    this.listaPlantas.find((planta) => planta.id === plantaId);

    const feature = this.allFeatures.find((f) => f.getProperties().plantaId === plantaId);

    const focusedStyle = new Style({
      stroke: new Stroke({
        color: 'white',
        width: 6,
      }),
      fill: new Fill({
        color: this.getColorMae(feature.getProperties().mae, 0.3),
      }),
    });

    const unfocusedStyle = new Style({
      stroke: new Stroke({
        color: this.getColorMae(feature.getProperties().mae),
        width: 2,
      }),
      fill: new Fill({
        color: this.getColorMae(feature.getProperties().mae, 0.3),
      }),
    });

    if (focus) {
      feature.setStyle(focusedStyle);
    } else {
      feature.setStyle(unfocusedStyle);
    }
  }

  private average(data) {
    const sum = data.reduce(function (sum, value) {
      return sum + value;
    }, 0);

    const avg = sum / data.length;
    return avg;
  }

  private standardDeviation(values) {
    const avg = this.average(values);

    const squareDiffs = values.map((value) => {
      const diff = value - avg;
      const sqrDiff = diff * diff;
      return sqrDiff;
    });

    const avgSquareDiff = this.average(squareDiffs);

    const stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
  }

  get plantaHover() {
    return this._plantaHover;
  }

  set plantaHover(value: PlantaInterface) {
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
