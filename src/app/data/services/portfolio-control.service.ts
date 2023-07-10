import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { Feature } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';
import Map from 'ol/Map';
import { Coordinate } from 'ol/coordinate';

import { AuthService } from '@data/services/auth.service';
import { PlantaService } from '@data/services/planta.service';
import { InformeService } from '@data/services/informe.service';
import { OlMapService } from './ol-map.service';
import { DemoService } from './demo.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { UserInterface } from '@core/models/user';
import { CritCriticidad } from '@core/models/critCriticidad';
import { MathOperations } from '@core/classes/math-operations';

import { GLOBAL } from '@data/constants/global';
import { COLOR } from '@data/constants/color';

import { Patches } from '@core/classes/patches';

@Injectable({
  providedIn: 'root',
})
export class PortfolioControlService {
  private _initialized = false;
  initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _plantaHovered: PlantaInterface = undefined;
  plantaHovered$ = new BehaviorSubject<PlantaInterface>(this._plantaHovered);
  maePlantas: number[] = [];
  private _maeMedio: number = undefined;
  maeMedio$ = new BehaviorSubject<number>(this._maeMedio);
  private _maeSigma: number = undefined;
  maeSigma$ = new BehaviorSubject<number>(this._maeSigma);
  private fixableMaePlantas: number[] = [];
  private _fixableMaeMedio: number = undefined;
  fixableMaeMedio$ = new BehaviorSubject<number>(this._fixableMaeMedio);
  numPlantas = 0;
  potenciaTotal = 0;
  listaPlantas: PlantaInterface[] = [];
  listaInformes: InformeInterface[] = [];
  allFeatures: Feature<any>[] = [];
  user: UserInterface;
  criterioCriticidad: CritCriticidad;
  usersFakePlants = ['xsx8U7BrLRU20pj9Oa35ZbJIggx2', 'AM2qmC06OWPb3V1gXJXyEpGS3Uz2', 'I3VzW9HJ5UdIuJH0pbuX69TndDn2'];
  map: Map;
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
              this.plantaService.getAllPlantas(),
              this.plantaService.getPlantasDeEmpresa(this.user),
              this.informeService.getInformes(),
            ]);
          })
        )
        .pipe(take(1))
        .subscribe(([plantas, plantasEmpresa, informes]) => {
          const informesExtra = this.informeService.getInformesWithEmpresaId(informes, this.user.uid);

          const plantasExtra: PlantaInterface[] = plantas.filter(
            (planta) =>
              informesExtra.map((informe) => informe.plantaId).includes(planta.id) &&
              !plantasEmpresa.map((pl) => pl.id).includes(planta.id)
          );

          plantasEmpresa.push(...plantasExtra);

          if (plantasEmpresa !== undefined) {
            // AÑADIMOS PLANTAS FALSAS SOLO EN LOS USUARIOS DEMO
            if (this.usersFakePlants.includes(this.user.uid)) {
              plantasEmpresa = this.demoService.addPlantasFake(plantasEmpresa);
            }

            plantasEmpresa.forEach((planta) => {
              let informesPlanta = informes.filter((inf) => inf.plantaId === planta.id);

              // obtenemos los informes dentro de la interface si los tiene
              if (planta.hasOwnProperty('informes') && planta.informes.length > 0) {
                planta.informes.forEach((informe) => {
                  if (!informesPlanta.map((inf) => inf.id).includes(informe.id)) {
                    if (
                      informe.mae !== undefined &&
                      informe.mae !== Infinity &&
                      !isNaN(informe.mae) &&
                      informe.mae !== null &&
                      informe.disponible === true
                    ) {
                      informesPlanta.push(informe);
                    }
                  }
                });
              }

              // aplicamos parche para plantas compradas por Plenium a RIOS
              informesPlanta = Patches.plantsTwoClients(this.user.uid, informesPlanta);

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
                    // comprobamos si es un mae antiguo o nuevo
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
            });

            let lastReportDate = 0;
            this.listaPlantas.forEach((planta) => {
              const informesPlanta = this.listaInformes.filter((inf) => inf.plantaId === planta.id);
              const informeReciente = informesPlanta.reduce((prev, current) =>
                prev.fecha > current.fecha ? prev : current
              );

              // obtenemos la fecha del informe mas reciente
              if (new Date(informeReciente.fecha) > new Date(lastReportDate)) {
                lastReportDate = informeReciente.fecha;
              }

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

              // añadimos el mae reparables del informe mas reciente de cada planta
              this.fixableMaePlantas.push(informeReciente.fixablePower);
            });

            this.maeMedio = MathOperations.weightedAverage(
              this.maePlantas,
              this.listaPlantas.map((planta) => planta.potencia)
            );
            this.maeSigma = MathOperations.DAM(this.maePlantas, this.maeMedio);

            this.fixableMaeMedio = MathOperations.weightedAverage(
              this.fixableMaePlantas,
              this.listaPlantas.map((planta) => planta.potencia)
            );

            this.initialized = true;

            initService(true);
          }
        });
    });
  }

  getMaeMedioAndSigmaPortfolio(user: UserInterface): Observable<number[]> {
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

        const maeMedio = MathOperations.weightedAverage(maePlantas, potenciaPlantas);
        const maeSigma = MathOperations.DAM(maePlantas, maeMedio);

        return [maeMedio, maeSigma];
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

  checkPlantaSoloWebAntigua(plantaId: string): boolean {
    const plantasVerInformeAntiguo: string[] = [
      'yoKAhD3TWvbxrJ9eGcTR' /* Adrados de Ordas */,
      'zkW3KgOofLdSqV2hWvqD' /* Fuente Alamo NS */,
      // 'fjub5AUln6LZER8cQhyw' /* Mahora */,
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

  /////////////////     ESTILOS      ////////////////////

  public getColorMae(mae: number, opacity?: number): string {
    let colorMae = '';
    if (this.numPlantas < 3) {
      colorMae = COLOR.colores_severity_rgb[0];
      GLOBAL.mae_rangos.forEach((rango, index) => {
        if (mae > rango) {
          colorMae = COLOR.colores_severity_rgb[index + 1];
        }
      });
    } else {
      if (mae >= this.maeMedio + this.maeSigma) {
        colorMae = COLOR.colores_severity_rgb[2];
      } else if (mae <= this.maeMedio) {
        colorMae = COLOR.colores_severity_rgb[0];
      } else {
        colorMae = COLOR.colores_severity_rgb[1];
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
          colorMae = COLOR.colores_severity_rgb[index + 1];
        }
      });
    } else {
      if (mae >= this.maeMedio + this.maeSigma) {
        colorMae = COLOR.colores_severity_rgb[2];
      } else if (mae <= this.maeMedio) {
        colorMae = COLOR.colores_severity_rgb[0];
      } else {
        colorMae = COLOR.colores_severity_rgb[1];
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

  resetService() {
    this.initialized = false;
    this.plantaHovered = undefined;
    this.maePlantas = [];
    this.maeMedio = undefined;
    this.maeSigma = undefined;
    this.numPlantas = 0;
    this.potenciaTotal = 0;
    this.listaPlantas = [];
    this.allFeatures = [];
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

  get fixableMaeMedio() {
    return this._fixableMaeMedio;
  }

  set fixableMaeMedio(value: number) {
    this._fixableMaeMedio = value;
    this.fixableMaeMedio$.next(value);
  }

  get initialized() {
    return this._initialized;
  }

  set initialized(value: boolean) {
    this._initialized = value;
    this.initialized$.next(value);
  }
}
