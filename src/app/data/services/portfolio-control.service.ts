import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { Feature } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';
import Map from 'ol/Map';
import { Coordinate } from 'ol/coordinate';

import { GLOBAL } from '@data/constants/global';
import { AuthService } from '@data/services/auth.service';
import { PlantaService } from '@data/services/planta.service';
import { InformeService } from '@data/services/informe.service';
import { OlMapService } from './ol-map.service';
import { DemoService } from './demo.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { UserInterface } from '@core/models/user';
import { CritCriticidad } from '@core/models/critCriticidad';

@Injectable({
  providedIn: 'root',
})
export class PortfolioControlService {
  private _initialized = false;
  initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _plantaHovered: PlantaInterface = undefined;
  public plantaHovered$ = new BehaviorSubject<PlantaInterface>(this._plantaHovered);
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
  criterioCriticidad: CritCriticidad;
  usersFakePlants = ['xsx8U7BrLRU20pj9Oa35ZbJIggx2', 'AM2qmC06OWPb3V1gXJXyEpGS3Uz2', 'I3VzW9HJ5UdIuJH0pbuX69TndDn2'];
  public map: Map;
  isDemo = false;
  newPortfolio = false;

  constructor(
    public auth: AuthService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    private olMapService: OlMapService,
    private demoService: DemoService
  ) {}

  public initService(): Promise<boolean> {
    return new Promise((initService) => {
      this.auth.user$
        .pipe(
          take(1),
          switchMap((user) => {
            // solo para cuentas DEMO por ahora
            if (user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2' || user.uid === 'AM2qmC06OWPb3V1gXJXyEpGS3Uz2') {
              this.isDemo = true;
              this.newPortfolio = true;
            }

            this.user = user;

            let criterioId;
            if (user.hasOwnProperty('criterioId')) {
              criterioId = user.criterioId;
            } else {
              // si no tiene criterio propio usamos el criterio Solardrone5
              criterioId = 'aU2iM5nM0S3vMZxMZGff';
            }

            return this.plantaService.getCriterioCriticidad(criterioId);
          }),
          take(1),
          switchMap((criterio) => {
            this.criterioCriticidad = criterio;

            return combineLatest([
              this.plantaService.getPlantasDeEmpresa(this.user),
              this.informeService.getInformes(),
            ]);
          })
        )
        .pipe(take(3))
        .subscribe(([plantas, informes]) => {
          if (plantas !== undefined) {
            // AÑADIMOS PLANTAS FALSAS SOLO EN LOS USUARIOS DEMO
            if (this.usersFakePlants.includes(this.user.uid)) {
              plantas = this.demoService.addPlantasFake(plantas);
            }

            plantas.forEach((planta) => {
              const informesPlanta = informes.filter((inf) => inf.plantaId === planta.id);

              if (informesPlanta.length > 0) {
                informesPlanta.forEach((informe) => {
                  // si el informe es reciente ponemos el mae a 0 en las siguientes situaciones
                  if (informe.fecha > GLOBAL.newReportsDate) {
                    if (!informe.hasOwnProperty('mae')) {
                      informe.mae = 0;
                    } else if (isNaN(informe.mae) || informe.mae === Infinity || informe.mae === null) {
                      informe.mae = 0;
                    }
                  }

                  // comprobamos si el "mae" es correcto y si está "disponible"
                  if (
                    informe.mae !== undefined &&
                    informe.mae !== Infinity &&
                    !isNaN(informe.mae) &&
                    informe.mae !== null &&
                    informe.disponible === true
                  ) {
                    // comprobamos si es un mae aniguo o nuevo
                    informe.mae = this.getRightMae(planta, informe);

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
                    if (
                      informe.mae !== undefined &&
                      informe.mae !== Infinity &&
                      !isNaN(informe.mae) &&
                      informe.mae !== null &&
                      informe.disponible === true
                    ) {
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
              if (
                planta.tipo !== 'seguidores' &&
                informeReciente.fecha < GLOBAL.newReportsDate &&
                planta.id !== 'egF0cbpXnnBnjcrusoeR'
              ) {
                this.maePlantas.push(informeReciente.mae / 100);
              } else {
                // el resto añadimos normal
                this.maePlantas.push(informeReciente.mae);
              }
            });

            this.maeMedio = this.weightedAverage(
              this.maePlantas,
              this.listaPlantas.map((planta) => planta.potencia)
            );
            this.maeSigma = this.DAM(this.maePlantas, this.maeMedio);

            this.initialized = true;

            initService(true);
          }
        });
    });
  }

  getMaeMedioPortfolio(user: UserInterface): Observable<number> {
    return combineLatest([this.plantaService.getPlantasDeEmpresa(user), this.informeService.getInformes()]).pipe(
      map(([plantas, informes]) => {
        const maePlantas: number[] = [];
        const potenciaPlantas: number[] = [];

        plantas.forEach((planta) => {
          const informesPlanta = informes.filter((informe) => informe.disponible && informe.plantaId === planta.id);
          if (planta.hasOwnProperty('informes') && planta.informes.length > 0) {
            planta.informes.forEach((informe) => {
              if (!informesPlanta.map((inf) => inf.id).includes(informe.id) && informe.disponible) {
                informesPlanta.push(informe);
              }
            });
          }
          if (informesPlanta.length > 0) {
            // añadimos el mae del informe más reciente
            const informeReciente = informesPlanta.sort((a, b) => a.fecha - b.fecha).pop();
            if (informeReciente.hasOwnProperty('mae')) {
              maePlantas.push(this.getRightMae(planta, informeReciente));
              potenciaPlantas.push(planta.potencia);
            }
          }
        });

        return this.weightedAverage(maePlantas, potenciaPlantas);
      })
    );
  }

  getRightMae(planta: PlantaInterface, informe: InformeInterface): number {
    let mae = informe.mae;
    // dividimos por 100 el mae de los informes antiguos de fijas xq se ven en la web antigua
    if (
      (planta.tipo !== 'seguidores' && informe.fecha < GLOBAL.newReportsDate && planta.id !== 'egF0cbpXnnBnjcrusoeR') ||
      this.checkPlantaSoloWebAntigua(planta.id)
    ) {
      mae = mae / 100;
    }

    return mae;
  }

  private average(data) {
    const sum = data.reduce((s, value) => {
      return s + value;
    }, 0);

    const avg = sum / data.length;
    return avg;
  }

  private weightedAverage(arrValues, arrWeights) {
    const result = arrValues
      .map((value, i) => {
        const weight = arrWeights[i];
        const sum = value * weight;

        return [sum, weight];
      })
      .reduce(
        (p, c) => {
          return [p[0] + c[0], p[1] + c[1]];
        },
        [0, 0]
      );

    return result[0] / result[1];
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

  private DAM(values: number[], average: number): number {
    // desviacion media absoluta, para que no afectanten los extremos a la desviacion
    let sumatorioDesviaciones = 0;
    values.forEach((value) => {
      sumatorioDesviaciones = sumatorioDesviaciones + Math.abs(value - average);
    });

    return sumatorioDesviaciones / values.length;
  }

  checkPlantaSoloWebAntigua(plantaId: string): boolean {
    const plantasVerInformeAntiguo: string[] = [
      'yoKAhD3TWvbxrJ9eGcTR' /* Adrados de Ordas */,
      'zkW3KgOofLdSqV2hWvqD' /* Fuente Alamo NS */,
      'fjub5AUln6LZER8cQhyw' /* Mahora */,
    ];

    if (plantasVerInformeAntiguo.includes(plantaId)) {
      return true;
    } else {
      return false;
    }
  }

  setPopupPosition(coords: Coordinate) {
    if (this.map === undefined) {
      this.map = this.olMapService.map;
    }
    this.map.getOverlayById('popup').setPosition(coords);
  }

  resetService() {
    this.plantaHovered = undefined;
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
    let colorMae = '';
    if (this.numPlantas < 3) {
      GLOBAL.mae_rangos.forEach((rango, index) => {
        if (mae > rango) {
          colorMae = GLOBAL.colores_mae_rgb[index + 1];
        }
      });
    } else {
      if (mae >= this.maeMedio + this.maeSigma) {
        colorMae = GLOBAL.colores_mae_rgb[2];
      } else if (mae <= this.maeMedio) {
        colorMae = GLOBAL.colores_mae_rgb[0];
      } else {
        colorMae = GLOBAL.colores_mae_rgb[1];
      }
    }

    // si se envía opacidad
    if (opacity !== undefined) {
      colorMae = colorMae.replace(',1)', ',' + opacity + ')');
    }

    return colorMae;
  }

  getNewColorMae(mae: number, opacity?: number): string {
    let colorMae = '';
    if (this.numPlantas < 3) {
      GLOBAL.mae_rangos.forEach((rango, index) => {
        if (mae >= rango) {
          colorMae = GLOBAL.colores_new_mae_rgb[index + 1];
        }
      });
    } else {
      if (mae >= this.maeMedio + this.maeSigma) {
        colorMae = GLOBAL.colores_new_mae_rgb[2];
      } else if (mae <= this.maeMedio) {
        colorMae = GLOBAL.colores_new_mae_rgb[0];
      } else {
        colorMae = GLOBAL.colores_new_mae_rgb[1];
      }
    }

    // si se envía opacidad
    if (opacity !== undefined) {
      colorMae = colorMae.replace(',1)', ',' + opacity + ')');
    }

    return colorMae;
  }

  getGravedadMae(mae: number) {
    let gravedad = GLOBAL.mae_rangos_labels[0];
    if (this.numPlantas < 3) {
      GLOBAL.mae_rangos.forEach((rango, index) => {
        if (mae >= rango) {
          gravedad = GLOBAL.mae_rangos_labels[index + 1];
        }
      });
    } else {
      if (mae >= this.maeMedio + this.maeSigma) {
        gravedad = GLOBAL.mae_rangos_labels[2];
      } else if (mae <= this.maeMedio) {
        gravedad = GLOBAL.mae_rangos_labels[0];
      } else {
        gravedad = GLOBAL.mae_rangos_labels[1];
      }
    }

    return gravedad;
  }

  getGravedadCC(cc: number) {
    let gravedad = GLOBAL.mae_rangos_labels[0];
    GLOBAL.cc_rangos.forEach((rango, index) => {
      if (cc >= rango) {
        gravedad = GLOBAL.mae_rangos_labels[index + 1];
      }
    });

    return gravedad;
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

  get plantaHovered() {
    return this._plantaHovered;
  }

  set plantaHovered(value: PlantaInterface) {
    this._plantaHovered = value;
    this.plantaHovered$.next(value);
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

  get initialized() {
    return this._initialized;
  }

  set initialized(value: boolean) {
    this._initialized = value;
    this.initialized$.next(value);
  }
}
