import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Feature } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';

import { GLOBAL } from './global';
import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

@Injectable({
  providedIn: 'root',
})
export class PortfolioControlService {
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _plantaHover: PlantaInterface = undefined;
  public plantaHover$ = new BehaviorSubject<PlantaInterface>(this._plantaHover);
  public maePlantas: number[] = [];
  private _maeMedio: number = undefined;
  public maeMedio$ = new BehaviorSubject<number>(this._maeMedio);
  private _maeSigma: number = undefined;
  public maeSigma$ = new BehaviorSubject<number>(this._maeSigma);
  public numPlantas = 0;
  public potenciaTotal = 0;
  public listaPlantas: PlantaInterface[] = [];
  public listaInformes: InformeInterface[] = [];
  public allFeatures: Feature[] = [];

  constructor(public auth: AuthService, private plantaService: PlantaService, private informeService: InformeService) {}

  public initService(): Observable<boolean> {
    this.auth.user$
      .pipe(
        switchMap((user) =>
          combineLatest([this.plantaService.getPlantasDeEmpresa(user), this.informeService.getInformes()])
        )
      )
      .subscribe(([plantas, informes]) => {
        if (plantas !== undefined) {
          plantas.forEach((planta) => {
            // obtenemos la plantas que tiene informes dentro de su interface
            if (planta.informes !== undefined && planta.informes.length > 0) {
              // comprobamos tb los posibles informes adiccionales fuera del doc planta
              const informesAdiccionales: InformeInterface[] = informes
                .filter((informe) => informe.plantaId === planta.id)
                .filter((informe) => !planta.informes.includes(informe));

              const informesPlanta = [...informesAdiccionales, ...planta.informes];

              // seleccionamos el dato de mae mas reciente
              const mae = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae;

              // comprobamos que el informe tiene "mae"
              if (mae !== undefined) {
                // añadimos la planta y su mae a las listas
                this.listaPlantas.push(planta);
                this.maePlantas.push(mae);

                // añadimos los informes a la lista
                informesPlanta.forEach((informe) => {
                  if (informe.mae !== undefined) {
                    this.listaInformes.push(informe);
                  }
                });

                // incrementamos conteo de plantas y suma de potencia
                this.numPlantas++;
                this.potenciaTotal += planta.potencia;
              }
              // añadimos tb aquellas plantas que tienen informes pero no estan incluidos dentro de su interface
            } else if (informes.map((inf) => inf.plantaId).includes(planta.id)) {
              const informe = informes.find((inf) => inf.plantaId === planta.id);

              // comprobamos que el informe tiene "mae"
              if (informe.mae !== undefined) {
                // añadimos el informe a la lista
                this.listaInformes.push(informe);

                // añadimos la planta y su mae a las listas
                this.listaPlantas.push(planta);
                this.maePlantas.push(informe.mae);

                // incrementamos conteo de plantas y suma de potencia
                this.numPlantas++;
                this.potenciaTotal += planta.potencia;
              }
            }
          });

          this.maeMedio = this.average(this.maePlantas);
          // this.maeSigma = this.standardDeviation(this.maePlantas);
          this.maeSigma = this.standardDeviation(this.maePlantas) / 3; // DEMO

          this.initialized$.next(true);
        }
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

  resetService() {
    this.plantaHover = undefined;
    this.maePlantas = [];
    this.maeMedio = undefined;
    this.maeSigma = undefined;
    this.numPlantas = 0;
    this.potenciaTotal = 0;
    this.listaPlantas = [];
    this.allFeatures = [];
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
