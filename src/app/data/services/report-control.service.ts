import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { WINDOW } from '../../window.providers';

import { BehaviorSubject, from } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { FilterService } from '@data/services/filter.service';
import { ShareReportService } from '@data/services/share-report.service';
import { InformeService } from '@data/services/informe.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { SeguidorService } from '@data/services/seguidor.service';
import { PlantaService } from '@data/services/planta.service';
import { AuthService } from '@data/services/auth.service';
import { ZonesService } from './zones.service';
import { ComentariosService } from './comentarios.service';

import { ParamsFilterShare } from '@core/models/paramsFilterShare';
import { FilterableElement } from '@core/models/filterableInterface';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { LocationAreaInterface } from '@core/models/location';
import { CritCriticidad } from '@core/models/critCriticidad';
import { PlantaInterface } from '@core/models/planta';
import { UserInterface } from '@core/models/user';
import { DemoService } from './demo.service';

import { GLOBAL } from '@data/constants/global';

import { Patches } from '@core/classes/patches';
import { Comentario } from '@core/models/comentario';

@Injectable({
  providedIn: 'root',
})
export class ReportControlService {
  private _sharedReport = false;
  public sharedReport$ = new BehaviorSubject<boolean>(this._sharedReport);
  private _sharedReportWithFilters = true;
  public sharedReportWithFilters$ = new BehaviorSubject<boolean>(this._sharedReportWithFilters);
  completeSharedViewPlants = ['egF0cbpXnnBnjcrusoeR']; //  Demo
  private _completeView = false;
  public completeView$ = new BehaviorSubject<boolean>(this._completeView);
  private sharedId: string;
  private _plantaId: string = undefined;
  public plantaId$ = new BehaviorSubject<string>(this._plantaId);
  private _planta: PlantaInterface = undefined;
  planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  private _selectedInformeId: string = undefined;
  public selectedInformeId$ = new BehaviorSubject<string>(this._selectedInformeId);
  private _informesIdList: string[] = [];
  public informesIdList$ = new BehaviorSubject<string[]>(this._informesIdList);
  private _informes: InformeInterface[] = [];
  public informes$ = new BehaviorSubject<InformeInterface[]>(this._informes);
  private _initialized = false;
  public initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _mapLoaded = false;
  public mapLoaded$ = new BehaviorSubject<boolean>(this._mapLoaded);
  private _allFilterableElements: FilterableElement[] = [];
  public allFilterableElements$ = new BehaviorSubject<FilterableElement[]>(this._allFilterableElements);
  private _allAnomalias: Anomalia[] = [];
  allAnomalias$ = new BehaviorSubject<Anomalia[]>(this._allAnomalias);
  public plantaFija = undefined;
  private _nombreGlobalCoords: string[] = [];
  private _numFixedGlobalCoords: number = 3;
  private _noAnomsReport = false;
  noAnomsReport$ = new BehaviorSubject<boolean>(this._noAnomsReport);
  user: UserInterface;

  constructor(
    private router: Router,
    private shareReportService: ShareReportService,
    private filterService: FilterService,
    private informeService: InformeService,
    private anomaliaService: AnomaliaService,
    private seguidorService: SeguidorService,
    @Inject(WINDOW) private window: Window,
    private plantaService: PlantaService,
    private authService: AuthService,
    private zonesService: ZonesService,
    private comentariosService: ComentariosService,
    private demoService: DemoService
  ) {}

  initService(): Promise<boolean> {
    if (!this.router.url.includes('shared')) {
      // obtenemos plantaId de la url
      this.plantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

      return new Promise((initService) => {
        // iniciamos anomalia service antes de obtener las anomalias
        this.anomaliaService.initService(this.plantaId).then(() =>
          this.authService.user$
            .pipe(
              take(1),
              switchMap((user) => {
                this.user = user;

                return this.plantaService.getPlanta(this.plantaId);
              }),
              take(1),
              switchMap((planta) => {
                this.planta = planta;

                if (this.planta.hasOwnProperty('nombreGlobalCoords')) {
                  this.nombreGlobalCoords = this.planta.nombreGlobalCoords;
                }

                // iniciamos el servicio de zonas
                return from(this.zonesService.initService(this.planta));
              }),
              take(1),
              switchMap(() => {
                if (this.authService.userIsAdmin(this.user)) {
                  return this.informeService.getInformesDePlanta(this.plantaId);
                  // return combineLatest([
                  //   this.informeService.getInformesDePlanta(this.plantaId),
                  //   this.informeService.getInformesDeEmpresa(this.planta.empresa),
                  // ]).pipe(map((infs) => infs.flat()));
                } else {
                  return this.informeService.getInformesDisponiblesDePlanta(this.plantaId);
                }
              }),
              take(1),
              // obtenemos los informes de la planta
              switchMap((informes) => {
                this.informes = informes;

                // si el user no es admin aplicamos el parche
                if (!this.authService.userIsAdmin(this.user)) {
                  // parche plantas que compró Plenium a RIOS
                  this.informes = Patches.plantsTwoClients(this.user.uid, informes);
                }

                if (this.router.url.includes('fixed')) {
                  this.plantaFija = true;

                  // seleccionamos los informes nuevos de fijas. Los antiguos se muestran con la web antigua
                  this.informes = this.informeService.getOnlyNewInfomesFijas(this.informes);
                } else {
                  this.plantaFija = false;
                }

                // evitamos cargar los informes dobles al navegar atras y volver
                if (this.informesIdList.length === 0) {
                  // añadimos los informes  a la lista
                  this.informes.forEach((informe) => this.informesIdList.push(informe.id));
                }

                this.selectedInformeId = this.informesIdList[this.informesIdList.length - 1];

                if (this.plantaFija) {
                  // obtenemos todas las anomalías
                  return this.anomaliaService.getAnomaliasPlanta$(this.planta, this.informes);
                } else {
                  // obtenemos todos los seguidores
                  return this.seguidorService.getSeguidoresPlanta$(this.planta, this.informes);
                }
              }),
              take(1),
              switchMap((elems) => {
                if (this.plantaFija) {
                  this.allFilterableElements = this.anomaliaService.getRealAnomalias(elems as Anomalia[]);

                  if (this.allFilterableElements.length === 0) {
                    this.noAnomsReport = true;
                  } else {
                    this.numFixedGlobalCoords = this.getNumGlobalCoords(this.allFilterableElements as Anomalia[]);
                  }

                  this.allAnomalias = this.allFilterableElements as Anomalia[];
                } else {
                  this.allFilterableElements = elems;

                  (this.allFilterableElements as Seguidor[]).forEach((seg) => {
                    if (seg.anomaliasCliente.length > 0) {
                      this.allAnomalias.push(...seg.anomaliasCliente);
                    }
                  });
                }

                return this.comentariosService.getComentariosInformes(this.informes);
              }),
              take(1)
            )
            .subscribe((comentarios: Comentario[]) => {
              // const coms = comentarios as Comentario[];
              if (this.plantaFija) {
                const anomsWithComentarios = this.allFilterableElements as Anomalia[];
                anomsWithComentarios.forEach((anom) => {
                  const comentariosAnom = comentarios.filter((com) => com.anomaliaId === anom.id);

                  anom.comentarios = comentariosAnom;
                });
                this.allFilterableElements = anomsWithComentarios;
              } else {
                const segsWithComentarios = this.allFilterableElements as Seguidor[];
                segsWithComentarios.map((seg) => {
                  seg.anomaliasCliente.forEach((anom) => {
                    const comentariosAnom = comentarios.filter((com) => com.anomaliaId === anom.id);

                    anom.comentarios = comentariosAnom;
                  });
                });
                this.allFilterableElements = segsWithComentarios;
              }

              // guardamos los datos de los diferentes recuentos de anomalias en el informe
              this.setCountAnomsInformesPlanta(this.allFilterableElements);

              // calculamos el MAE y las CC de los informes si no tuviesen
              this.checkMaeInformes(this.allFilterableElements);
              this.checkCCInformes(this.allFilterableElements);

              // iniciamos filter service
              this.filterService.initService(this.allFilterableElements).then((filtersInit) => {
                // enviamos respuesta de servicio iniciado
                initService(filtersInit);
              });
            })
        );
      });
    } else {
      ///////////////////// SHARED REPORT ///////////////////////
      this.sharedReport = true;

      // comprobamos si es filtrable
      if (!this.router.url.includes('filterable')) {
        this.sharedReportWithFilters = false;
      }
      // obtenemos el ID de la URL
      this.sharedId = this.router.url.split('/')[this.router.url.split('/').length - 1];

      // iniciamos el servicio share-report
      this.shareReportService.initService(this.sharedId);

      return new Promise((initService) => {
        // obtenemos los parámetros necesarios
        this.shareReportService
          .getParamsById(this.sharedId)
          .get()
          .toPromise()
          .then((doc) => {
            if (doc.exists) {
              const params = doc.data() as ParamsFilterShare;
              this.plantaId = params.plantaId;
              this.selectedInformeId = params.informeId;

              // comprobamos si ese enlace shared debe mostrar la vista completa
              if (this.plantaId === this.demoService.plantaId) {
                this.completeView = true;
              }

              if (!this.router.url.includes('filterable')) {
                // iniciamos anomalia service antes de obtener las anomalias
                this.anomaliaService.initService(this.plantaId).then(() =>
                  this.plantaService
                    .getPlanta(this.plantaId)
                    .pipe(
                      take(1),
                      switchMap((planta) => {
                        this.planta = planta;

                        // iniciamos el servicio de zonas
                        return from(this.zonesService.initService(this.planta));
                      }),
                      take(1),
                      switchMap(() => this.informeService.getInforme(this.selectedInformeId)),
                      take(1),
                      switchMap((informe) => {
                        this.informes = [informe];

                        if (this.router.url.includes('fixed')) {
                          this.plantaFija = true;

                          return this.anomaliaService.getAnomaliasPlanta$(this.planta, this.informes);
                        } else {
                          this.plantaFija = false;

                          return this.seguidorService.getSeguidoresPlanta$(this.planta, this.informes);
                        }
                      }),
                      take(1)
                    )
                    .subscribe((elems) => {
                      if (this.plantaFija) {
                        this.allFilterableElements = this.anomaliaService.getRealAnomalias(elems as Anomalia[]);

                        this.allAnomalias = this.allFilterableElements as Anomalia[];
                      } else {
                        this.allFilterableElements = elems;

                        (this.allFilterableElements as Seguidor[]).forEach((seg) => {
                          if (seg.anomaliasCliente.length > 0) {
                            this.allAnomalias.push(...seg.anomaliasCliente);
                          }
                        });
                      }

                      // iniciamos filter service
                      this.filterService
                        .initService(this.allFilterableElements, true, this.sharedId)
                        .then((filtersInit) => {
                          // enviamos respuesta de servicio iniciado
                          initService(filtersInit);
                        });
                    })
                );
              } else {
                //////////////////// FILTERABLE SHARED REPORT /////////////////////////
                // iniciamos anomalia service antes de obtener las anomalias
                this.anomaliaService.initService(this.plantaId).then(() =>
                  this.plantaService
                    .getPlanta(this.plantaId)
                    .pipe(
                      take(1),
                      switchMap((planta) => {
                        this.planta = planta;

                        // iniciamos el servicio de zonas
                        return from(this.zonesService.initService(this.planta));
                      }),
                      take(1),
                      switchMap(() => this.informeService.getInformesDisponiblesDePlanta(this.plantaId)),
                      take(1),
                      // obtenemos los informes de la planta
                      switchMap((informes) => {
                        // seleccionamos los informes nuevos de fijas. Los antiguos se muestran con la web antigua
                        this.informes = this.informeService.getOnlyNewInfomesFijas(informes);

                        // evitamos cargar los informes dobles al navegar atras y volver
                        if (this.informesIdList.length === 0) {
                          // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                          this.informes.forEach((informe) => this.informesIdList.push(informe.id));
                        }

                        if (this.router.url.includes('fixed')) {
                          this.plantaFija = true;

                          // obtenemos todas las anomalías
                          return this.anomaliaService.getAnomaliasPlanta$(this.planta, this.informes);
                        } else {
                          this.plantaFija = false;

                          // obtenemos todos los seguidores
                          return this.seguidorService.getSeguidoresPlanta$(this.planta, this.informes);
                        }
                      }),
                      take(1)
                    )
                    .subscribe((elems) => {
                      if (this.plantaFija) {
                        this.allFilterableElements = this.anomaliaService.getRealAnomalias(elems as Anomalia[]);

                        this.allAnomalias = this.allFilterableElements as Anomalia[];
                      } else {
                        this.allFilterableElements = elems;

                        (this.allFilterableElements as Seguidor[]).forEach((seg) => {
                          if (seg.anomaliasCliente.length > 0) {
                            this.allAnomalias.push(...seg.anomaliasCliente);
                          }
                        });
                      }

                      // iniciamos filter service
                      this.filterService
                        .initService(this.allFilterableElements, true, this.sharedId)
                        .then((filtersInit) => {
                          // enviamos respuesta de servicio iniciado
                          initService(filtersInit);
                        });
                    })
                );
              }
            } else {
              console.log('No existe el documento');
            }
          })
          .catch((error) => console.log('Error accediendo al documento: ', error));
      });
    }
  }

  getNumGlobalCoords(anoms: Anomalia[]): number {
    let numGlobalCoords = 0;
    if (anoms.length > 0) {
      numGlobalCoords = anoms[0].globalCoords.length;

      for (let index = numGlobalCoords - 1; index >= 0; index--) {
        if (
          anoms.filter(
            (anom) =>
              anom.globalCoords[index] !== null &&
              anom.globalCoords[index] !== undefined &&
              anom.globalCoords[index] !== ''
          ).length > 0
        ) {
          numGlobalCoords = index + 1;

          break;
        } else {
          numGlobalCoords = index;
        }
      }
    }

    return numGlobalCoords;
  }

  private checkMaeInformes(elems: FilterableElement[]): void {
    if (elems.length > 0) {
      this.informes.forEach((informe) => {
        if (this.checkIfNumberValueWrong(informe.mae)) {
          if (elems[0].hasOwnProperty('anomaliasCliente')) {
            this.setMaeInformeSeguidores(elems as Seguidor[], informe);
          } else {
            this.setMaeInformeFija(elems as Anomalia[], informe);
          }
        }
      });
    }
  }

  setMaeInformeSeguidores(seguidores: Seguidor[], informe: InformeInterface) {
    const seguidoresInforme = seguidores.filter((seg) => seg.informeId === informe.id);
    let mae = 0;
    seguidoresInforme.forEach((seg) => (mae = mae + seg.mae));
    mae = mae / seguidoresInforme.length;

    this.informeService.updateInformeField(informe.id, 'mae', mae);
  }

  setMaeInformeFija(anomalias: Anomalia[], informe: InformeInterface) {
    const anomaliasInforme = anomalias.filter((anom) => anom.informeId === informe.id);
    let mae = 0;
    if (anomaliasInforme.length > 0) {
      const perdidas = anomaliasInforme.map((anom) => anom.perdidas);
      let perdidasTotales = 0;
      perdidas.forEach((perd) => (perdidasTotales += perd));

      mae = perdidasTotales / informe.numeroModulos;
    }

    this.informeService.updateInformeField(informe.id, 'mae', mae);
  }

  private checkCCInformes(elems: FilterableElement[]): void {
    if (elems.length > 0) {
      this.informes.forEach((informe) => {
        if (this.checkIfNumberValueWrong(informe.cc)) {
          if (elems[0].hasOwnProperty('anomaliasCliente')) {
            this.setCCInformeSeguidores(elems as Seguidor[], informe);
          } else {
            this.setCCInformeFija(elems as Anomalia[], informe);
          }
        }
      });
    }
  }

  setCCInformeSeguidores(seguidores: Seguidor[], informe: InformeInterface) {
    const seguidoresInforme = seguidores.filter((seg) => seg.informeId === informe.id);
    let cc = 0;
    seguidoresInforme.forEach((seg) => (cc = cc + seg.celsCalientes));
    cc = cc / seguidoresInforme.length;

    this.informeService.updateInformeField(informe.id, 'cc', cc);
  }

  setCCInformeFija(anomalias: Anomalia[], informe: InformeInterface) {
    const anomaliasInforme = anomalias.filter((anom) => anom.informeId === informe.id);
    let cc = 0;
    if (anomaliasInforme.length > 0) {
      // tslint:disable-next-line: triple-equals
      const celCals = anomaliasInforme.filter((anom) => anom.tipo == 8 || anom.tipo == 9);

      cc = celCals.length / informe.numeroModulos;
    }

    this.informeService.updateInformeField(informe.id, 'cc', cc);
  }

  private checkIfNumberValueWrong(value: any): boolean {
    if (
      // tslint:disable-next-line: triple-equals
      value == 0 ||
      value === undefined ||
      value === null ||
      isNaN(value) ||
      value === Infinity
    ) {
      return true;
    } else {
      return false;
    }
  }

  private setCountAnomsInformesPlanta(elems: FilterableElement[]) {
    let anomalias: Anomalia[] = [];
    if (elems.length > 0) {
      if (elems[0].hasOwnProperty('tipo')) {
        anomalias = elems as Anomalia[];
      } else {
        elems.forEach((elem) => {
          anomalias.push(...(elem as Seguidor).anomaliasCliente);
        });
      }

      this.informes.forEach((informe) => {
        const anomaliasInforme = anomalias.filter((anom) => anom.informeId === informe.id);

        // guardamos el recuento de anomalias por tipo
        this.setTiposAnomInforme(anomaliasInforme, informe, false);

        // guardamos el recuento de anomalias por clase
        this.setNumAnomsCoAInforme(anomaliasInforme, informe, false);

        // guardamos el recuento de anomalias por criticidad
        this.setNumAnomsCritInforme(anomaliasInforme, informe, false);
      });
    }
  }

  setTiposAnomInforme(anomalias: Anomalia[], informe: InformeInterface, replace: boolean, criterio?: CritCriticidad) {
    if (anomalias.length > 0 && (!informe.hasOwnProperty('tiposAnomalias') || replace)) {
      let rangosDT = this.anomaliaService.criterioCriticidad.rangosDT;
      if (criterio !== undefined) {
        rangosDT = criterio.rangosDT;
      }

      const tiposAnomalias = new Array(GLOBAL.labels_tipos.length);

      GLOBAL.labels_tipos.forEach((_, index) => {
        // las celulas calientes las dividimos por gradiente normalizado segun el criterio de criticidad de la empresa
        if (index === 8 || index === 9) {
          const ccGradNorm: number[] = [];
          // tslint:disable-next-line: triple-equals
          const ccs = anomalias.filter((anom) => anom.tipo == index);

          rangosDT.forEach((rango, i, rangs) => {
            if (i < rangs.length - 1) {
              ccGradNorm.push(
                ccs.filter((anom) => anom.gradienteNormalizado >= rango).length -
                  ccs.filter((anom) => anom.gradienteNormalizado >= rangs[i + 1]).length
              );
            } else {
              ccGradNorm.push(ccs.filter((anom) => anom.gradienteNormalizado >= rango).length);
            }
          });

          tiposAnomalias[index] = ccGradNorm;
        } else {
          // tslint:disable-next-line: triple-equals
          tiposAnomalias[index] = anomalias.filter((anom) => anom.tipo == index).length;
        }
      });

      informe.tiposAnomalias = tiposAnomalias;

      const sumTiposAnoms = tiposAnomalias.reduce((acum, curr, index) => {
        if (index === 8 || index === 9) {
          return acum + curr.reduce((a, c) => a + c);
        } else {
          return acum + curr;
        }
      });

      if (sumTiposAnoms === anomalias.length) {
        this.informeService.updateInforme(informe);
      } else {
        console.log('Informe ' + informe.id + ' no actualizado. PlantaId: ' + informe.plantaId);
      }
    }
  }

  setNumAnomsCoAInforme(anomalias: Anomalia[], informe: InformeInterface, replace: boolean): void {
    if (anomalias.length > 0 && (!informe.hasOwnProperty('numsCoA') || replace)) {
      const numsCoA: number[] = [
        // tslint:disable-next-line: triple-equals
        anomalias.filter((anom) => anom.clase == 1).length,
        // tslint:disable-next-line: triple-equals
        anomalias.filter((anom) => anom.clase == 2).length,
        // tslint:disable-next-line: triple-equals
        anomalias.filter((anom) => anom.clase == 3).length,
      ];

      informe.numsCoA = numsCoA;

      const sumCoAs = numsCoA[0] + numsCoA[1] + numsCoA[2];

      if (sumCoAs === anomalias.length) {
        this.informeService.updateInforme(informe);
      } else {
        console.log('Informe ' + informe.id + ' no actualizado. PlantaId: ' + informe.plantaId);
      }
    }
  }

  setNumAnomsCritInforme(
    anomalias: Anomalia[],
    informe: InformeInterface,
    replace: boolean,
    criterio?: CritCriticidad
  ): void {
    if (anomalias.length > 0 && (!informe.hasOwnProperty('numsCriticidad') || replace)) {
      let rangosDT = this.anomaliaService.criterioCriticidad.rangosDT;
      if (criterio !== undefined) {
        rangosDT = criterio.rangosDT;
        this.anomaliaService.criterioCriticidad = criterio;
      }

      const numsCriticidad: number[] = [];
      rangosDT.forEach((rangoDT, index) =>
        // tslint:disable-next-line: triple-equals
        numsCriticidad.push(anomalias.filter((anom) => anom.criticidad == index).length)
      );

      informe.numsCriticidad = numsCriticidad;

      const sumCrits = numsCriticidad.reduce((prev, current) => prev + current);

      if (sumCrits === anomalias.length) {
        this.informeService.updateInforme(informe);
      } else {
        console.log('Informe ' + informe.id + ' no actualizado. PlantaId: ' + informe.plantaId);
      }
    }
  }

  sortLocAreas(locAreas: LocationAreaInterface[]) {
    // comprobamos si el nombre de las zonas es un numero
    if (!isNaN(parseFloat(locAreas[0].globalCoords[0]))) {
      locAreas = locAreas.sort((a, b) => parseFloat(a.globalCoords[0]) - parseFloat(b.globalCoords[0]));
    } else if (locAreas[0].globalCoords[0].match(/\d+/g) !== null) {
      // si no es un numero buscamos si tiene alguno incluido para ordenarlo
      locAreas.sort((a, b) => {
        let numsA = '';
        a.globalCoords[0].match(/\d+/g).forEach((element) => {
          numsA += element;
        });
        let numsB = '';
        b.globalCoords[0].match(/\d+/g).forEach((element) => {
          numsB += element;
        });

        return Number(numsA) - Number(numsB);
      });
    }

    return locAreas;
  }

  getHostname(): string {
    return this.window.location.hostname;
  }

  resetService() {
    this.sharedReport = false;
    this.sharedReportWithFilters = true;
    this.plantaId = undefined;
    this.selectedInformeId = undefined;
    this.informes = [];
    this.informesIdList = [];
    this.initialized = false;
    this.mapLoaded = false;
    this.allAnomalias = [];
    this.allFilterableElements = [];
    this.plantaFija = undefined;
    this.noAnomsReport = false;
    this.numFixedGlobalCoords = 3;
  }

  get sharedReport() {
    return this._sharedReport;
  }

  set sharedReport(value: boolean) {
    this._sharedReport = value;
    this.sharedReport$.next(value);
  }

  get sharedReportWithFilters() {
    return this._sharedReportWithFilters;
  }

  set sharedReportWithFilters(value: boolean) {
    this._sharedReportWithFilters = value;
    this.sharedReportWithFilters$.next(value);
  }

  get plantaId() {
    return this._plantaId;
  }

  set plantaId(value: string) {
    this._plantaId = value;
    this.plantaId$.next(value);
  }

  get selectedInformeId() {
    return this._selectedInformeId;
  }

  set selectedInformeId(value: string) {
    this._selectedInformeId = value;
    this.selectedInformeId$.next(value);
  }

  get informesIdList() {
    return this._informesIdList;
  }

  set informesIdList(value: string[]) {
    this._informesIdList = value;
    this.informesIdList$.next(value);
  }

  get informes() {
    return this._informes;
  }

  set informes(value: InformeInterface[]) {
    this._informes = value;
    this.informes$.next(value);
  }

  get initialized() {
    return this._initialized;
  }

  set initialized(value: boolean) {
    this._initialized = value;
    this.initialized$.next(value);
  }

  get mapLoaded() {
    return this._mapLoaded;
  }

  set mapLoaded(value: boolean) {
    this._mapLoaded = value;
    this.mapLoaded$.next(value);
  }

  get allFilterableElements() {
    return this._allFilterableElements;
  }

  set allFilterableElements(value: FilterableElement[]) {
    this._allFilterableElements = value;
    this.allFilterableElements$.next(value);
  }

  get allAnomalias(): Anomalia[] {
    return this._allAnomalias;
  }

  set allAnomalias(value: Anomalia[]) {
    this._allAnomalias = value;
    this.allAnomalias$.next(value);
  }

  get nombreGlobalCoords() {
    return this._nombreGlobalCoords;
  }

  set nombreGlobalCoords(value: string[]) {
    this._nombreGlobalCoords = value;
  }

  get numFixedGlobalCoords() {
    return this._numFixedGlobalCoords;
  }

  set numFixedGlobalCoords(value: number) {
    this._numFixedGlobalCoords = value;
  }

  get noAnomsReport() {
    return this._noAnomsReport;
  }

  set noAnomsReport(value: boolean) {
    this._noAnomsReport = value;
    this.noAnomsReport$.next(value);
  }

  get completeView() {
    return this._completeView;
  }

  set completeView(value: boolean) {
    this._completeView = value;
    this.completeView$.next(value);
  }

  get planta() {
    return this._planta;
  }

  set planta(value: PlantaInterface) {
    this._planta = value;
    this.planta$.next(value);
  }
}
