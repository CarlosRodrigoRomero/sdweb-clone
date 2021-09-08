import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { Feature } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';

import { GLOBAL } from './global';
import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { UserInterface } from '@core/models/user';

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
  user: UserInterface;

  constructor(public auth: AuthService, private plantaService: PlantaService, private informeService: InformeService) {}

  public initService(): Promise<boolean> {
    return new Promise((initService) => {
      this.auth.user$
        .pipe(
          take(1),
          switchMap((user) => {
            this.user = user;

            return combineLatest([this.plantaService.getPlantasDeEmpresa(user), this.informeService.getInformes()]);
          })
        )
        .pipe(take(1))
        .subscribe(([plantas, informes]) => {
          if (plantas !== undefined) {
            // AÑADIMOS PLANTAS FALSAS SOLO EN EL USUARIO DEMO
            if (this.user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2' || this.user.uid === 'AM2qmC06OWPb3V1gXJXyEpGS3Uz2') {
              plantas = this.addPlantasFake(plantas);
            }

            plantas.forEach((planta) => {
              const informesPlanta = informes.filter((inf) => inf.plantaId === planta.id);

              if (informesPlanta.length > 0) {
                informesPlanta.forEach((informe) => {
                  // comprobamos que el informe tiene "mae" y que esta "disponible"
                  if (informe.mae !== undefined && informe.mae !== Infinity && informe.disponible === true) {
                    // añadimos el informe a la lista
                    this.listaInformes.push(informe);

                    if (!this.listaPlantas.map((pl) => pl.id).includes(planta.id)) {
                      // añadimos la planta a la lista
                      this.listaPlantas.push(planta);
                      // incrementamos conteo de plantas y suma de potencia
                      this.numPlantas++;
                      this.potenciaTotal += planta.potencia;
                    }
                  }
                });
              }

              // obtenemos la plantas que tiene informes dentro de su interface
              if (planta.informes !== undefined && planta.informes.length > 0) {
                planta.informes.forEach((informe) => {
                  // comprobamos que no estubiese ya añadido
                  if (!this.listaInformes.map((inf) => inf.id).includes(informe.id)) {
                    // comprobamos que el informe tiene "mae" y que esta "disponible"
                    if (informe.mae !== undefined && informe.mae !== Infinity && informe.disponible === true) {
                      // añadimos el informe a la lista
                      this.listaInformes.push(informe);

                      if (!this.listaPlantas.map((pl) => pl.id).includes(planta.id)) {
                        // añadimos la planta si no estaba ya añadida
                        this.listaPlantas.push(planta);
                        // incrementamos conteo de plantas y suma de potencia
                        this.numPlantas++;
                        this.potenciaTotal += planta.potencia;
                      }
                    }
                  }
                });
              }
            });

            this.listaPlantas.forEach((planta) => {
              const informesPlanta = this.listaInformes.filter((inf) => inf.plantaId === planta.id);
              const informeReciente = informesPlanta.reduce((prev, current) =>
                prev.fecha > current.fecha ? prev : current
              );

              // añadimos el mae del informe mas reciente de cada planta
              // los antiguos de fijas los devidimos por 100
              if (planta.tipo !== 'seguidores' && informeReciente.fecha < 1619820000) {
                this.maePlantas.push(informeReciente.mae / 100);
              } else {
                // el resto añadimos normal
                this.maePlantas.push(informeReciente.mae);
              }
            });

            this.maeMedio = this.average(this.maePlantas);
            this.maeSigma = this.standardDeviation(this.maePlantas);
            // this.maeSigma = this.standardDeviation(this.maePlantas) / 3; // DEMO

            initService(true);
          }
        });
    });
  }

  private average(data) {
    const sum = data.reduce((s, value) => {
      return s + value;
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

  /////////////////     ESTILOS      ////////////////////

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

  // SOLO PARA DEMO
  private addPlantasFake(plantas: PlantaInterface[]) {
    const plantasFake: PlantaInterface[] = [
      {
        id: '01',
        nombre: 'Arriba',
        potencia: 25,
        latitud: 38.36439,
        longitud: -1.27652,
        informes: [{ id: '01', plantaId: '01', mae: 0.052, fecha: 1624270070, disponible: true }],
      },
      {
        id: '02',
        nombre: 'Villanueva',
        potencia: 10,
        latitud: 42,
        longitud: -1.5,
        informes: [{ id: '02', plantaId: '02', mae: 0.031, fecha: 1625737808, disponible: true }],
      },
      {
        id: '03',
        nombre: 'Trujillo',
        potencia: 12,
        latitud: 41.5,
        longitud: -6,
        informes: [{ id: '03', plantaId: '03', mae: 0.0103, fecha: 1625824208, disponible: true }],
      },
      {
        id: '04',
        nombre: 'Villa',
        potencia: 2,
        latitud: 37.5,
        longitud: -4,
        informes: [{ id: '04', plantaId: '04', mae: 0.006, fecha: 1625910608, disponible: true }],
      },
      {
        id: '05',
        nombre: 'Abajo',
        potencia: 6,
        latitud: 40,
        longitud: -4,
        informes: [{ id: '05', plantaId: '05', mae: 0.059, fecha: 1626083408, disponible: true }],
      },
      {
        id: '06',
        nombre: 'Los Infiernos',
        potencia: 50,
        latitud: 42.5,
        longitud: -6,
        informes: [{ id: '06', plantaId: '06', mae: 0.041, fecha: 1626083408, disponible: true }],
      },
      {
        id: '07',
        nombre: 'Santa Clara',
        potencia: 21,
        latitud: 40,
        longitud: -5,
        informes: [{ id: '07', plantaId: '07', mae: 0.015, fecha: 1626083408, disponible: true }],
      },
      {
        id: '08',
        nombre: 'Fresno',
        potencia: 5,
        latitud: 42,
        longitud: -3,
        informes: [{ id: '08', plantaId: '08', mae: 0.023, fecha: 1626083408, disponible: true }],
      },
      {
        id: '09',
        nombre: 'Parderrubias',
        potencia: 8,
        latitud: 41,
        longitud: -2,
        informes: [{ id: '09', plantaId: '09', mae: 0.032, fecha: 1626083408, disponible: true }],
      },
      {
        id: '10',
        nombre: 'Vicente',
        potencia: 23,
        latitud: 39,
        longitud: -1.5,
        informes: [{ id: '10', plantaId: '10', mae: 0.009, fecha: 1624226400, disponible: true }],
      },
    ];

    plantasFake.forEach((fake) => {
      plantas.push(fake);
    });

    return plantas;
  }
}
