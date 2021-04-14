import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';
import { GLOBAL } from './global';
import { UserInterface } from '@core/models/user';

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
  private _numPlantas;
  private _potenciaTotal;
  public listaPlantas: PlantaInterface[] = [];

  constructor(public auth: AuthService, private plantaService: PlantaService) {}

  public initService(user: UserInterface): Observable<boolean> {
    this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => {
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
      this.maeSigma = this.standardDeviation(maePlantas);

      this.initialized$.next(true);
    });

    return this.initialized$;
  }

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

  get numPlantas() {
    return this._numPlantas;
  }

  set numPlantas(value: number) {
    this._numPlantas = value;
  }

  get potenciaTotal() {
    return this._potenciaTotal;
  }

  set potenciaTotal(value: number) {
    this._potenciaTotal = value;
  }
}
