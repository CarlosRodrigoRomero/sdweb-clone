import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { WINDOW } from '../../window.providers';

import { BehaviorSubject, concat, Observable } from 'rxjs';
import { delay, flatMap, publish, switchMap, take, takeWhile } from 'rxjs/operators';

import { FilterService } from '@core/services/filter.service';
import { ShareReportService } from '@core/services/share-report.service';
import { InformeService } from '@core/services/informe.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { SeguidorService } from '@core/services/seguidor.service';

import { ParamsFilterShare } from '@core/models/paramsFilterShare';
import { FilterableElement } from '@core/models/filterableInterface';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

@Injectable({
  providedIn: 'root',
})
export class ReportControlService {
  private _sharedReport = false;
  public sharedReport$ = new BehaviorSubject<boolean>(this._sharedReport);
  private _sharedReportWithFilters = true;
  public sharedReportWithFilters$ = new BehaviorSubject<boolean>(this._sharedReportWithFilters);
  private sharedId: string;
  private _plantaId: string = undefined;
  public plantaId$ = new BehaviorSubject<string>(this._plantaId);
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
  public plantaFija = false;
  private _thereAreZones = true;
  public thereAreZones$ = new BehaviorSubject<boolean>(this._thereAreZones);
  private _nombreGlobalCoords: string[] = [];
  private _numFixedGlobalCoords: number = undefined;

  constructor(
    private router: Router,
    private shareReportService: ShareReportService,
    private filterService: FilterService,
    private informeService: InformeService,
    private anomaliaService: AnomaliaService,
    private seguidorService: SeguidorService,
    @Inject(WINDOW) private window: Window,
  ) {}

  initService(): Promise<boolean> {
    ////////////////////// PLANTA FIJA ////////////////////////
    if (this.router.url.includes('fixed')) {
      this.plantaFija = true;

      if (!this.router.url.includes('shared')) {
        // obtenemos plantaId de la url
        this.plantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

        return new Promise((initService) => {
          // iniciamos anomalia service antes de obtener las anomalias
          this.anomaliaService.initService(this.plantaId).then(() =>
            this.informeService
              .getInformesDePlanta(this.plantaId)
              .pipe(
                take(1),
                // obtenemos los informes de la planta
                switchMap((informes) => {
                  this.informes = informes;

                  // evitamos cargar los informes dobles al navegar atras y volver
                  if (this.informesIdList.length === 0) {
                    // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                    this.informes.forEach((informe) => this._informesIdList.push(informe.id));
                    this.informesIdList$.next(this._informesIdList);
                  }

                  this.selectedInformeId = this._informesIdList[this._informesIdList.length - 1];

                  // obtenemos todas las anomalías
                  return this.anomaliaService.getAnomaliasPlanta$(this.plantaId);
                }),
                take(1)
              )
              .subscribe((anoms) => {
                // filtramos las anomalias por criterio de criticidad del cliente
                // tslint:disable-next-line: triple-equals
                this.allFilterableElements = anoms.filter((anom) => anom.criticidad !== null);

                this.numFixedGlobalCoords = this.getNumGlobalCoords(this.allFilterableElements as Anomalia[]);

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
                if (!this.router.url.includes('filterable')) {
                  // iniciamos anomalia service antes de obtener las anomalias
                  this.anomaliaService.initService(this.plantaId).then(() =>
                    this.informeService
                      .getInforme(this.selectedInformeId)
                      .pipe(
                        take(1),
                        switchMap((informe) => {
                          this.informes = [informe];
                          return this.anomaliaService.getAnomaliasPlanta$(this.plantaId);
                        }),
                        take(1)
                      )
                      .subscribe((anoms) => {
                        // filtramos las anomalias por criterio de criticidad del cliente
                        // tslint:disable-next-line: triple-equals
                        this.allFilterableElements = anoms.filter((anom) => anom.criticidad !== null);

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
                    this.informeService
                      .getInformesDePlanta(this.plantaId)
                      .pipe(
                        take(1),
                        // obtenemos los informes de la planta
                        switchMap((informes) => {
                          this.informes = informes;

                          // evitamos cargar los informes dobles al navegar atras y volver
                          if (this.informesIdList.length === 0) {
                            // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                            this.informes.forEach((informe) => this._informesIdList.push(informe.id));
                            this.informesIdList$.next(this._informesIdList);
                          }

                          // obtenemos todas las anomalías
                          return this.anomaliaService.getAnomaliasPlanta$(this.plantaId);
                        }),
                        take(1)
                      )
                      .subscribe((anoms) => {
                        // filtramos las anomalias por criterio de criticidad del cliente
                        // tslint:disable-next-line: triple-equals
                        this.allFilterableElements = anoms.filter((anom) => anom.tipo != 0 && anom.criticidad !== null);

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
    } else {
      /////////////////// PLANTA SEGUIDORES //////////////////////
      if (!this.router.url.includes('shared')) {
        // obtenemos plantaId de la url
        this.plantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

        return new Promise((initService) => {
          // iniciamos anomalia service para cargar los criterios la planta
          this.anomaliaService.initService(this.plantaId).then(() => {
            this.informeService
              .getInformesDePlanta(this.plantaId)
              .pipe(
                take(1),
                // obtenemos los informes de la planta
                switchMap((informes) => {
                  this.informes = informes;

                  // evitamos cargar los informes dobles al navegar atras y volver
                  if (this.informesIdList.length === 0) {
                    // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                    this.informes.forEach((informe) => this._informesIdList.push(informe.id));
                    this.informesIdList$.next(this._informesIdList);
                  }
                  this.selectedInformeId = this._informesIdList[this._informesIdList.length - 1];
                  // obtenemos todos los seguidores
                  return this.seguidorService.getSeguidoresPlanta$(this.plantaId);
                }),
                take(1)
              )
              .subscribe((segs) => {
                this.allFilterableElements = segs;

                // calculamos el MAE y las CC de los informes si no tuviesen
                this.setMaeInformesPlanta(segs);
                this.setCCInformesPlanta(segs);

                // iniciamos filter service
                this.filterService.initService(segs).then((filtersInit) => {
                  // enviamos respuesta de servicio iniciado
                  initService(filtersInit);
                });
              });
          });
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
                if (!this.router.url.includes('filterable')) {
                  // iniciamos anomalia service antes de obtener las anomalias
                  this.anomaliaService.initService(this.plantaId).then(() =>
                    this.informeService
                      .getInforme(this.selectedInformeId)
                      .pipe(
                        take(1),
                        switchMap((informe) => {
                          this.informes = [informe];
                          return this.seguidorService.getSeguidoresPlanta$(this.plantaId);
                        }),
                        take(1)
                      )
                      .subscribe((segs) => {
                        this.allFilterableElements = segs;

                        // iniciamos filter service
                        this.filterService.initService(segs, true, this.sharedId).then((filtersInit) => {
                          // enviamos respuesta de servicio iniciado
                          initService(filtersInit);
                        });
                      })
                  );
                } else {
                  //////////////////// FILTERABLE SHARED REPORT /////////////////////////
                  // iniciamos anomalia service para cargar los criterios la planta
                  this.anomaliaService.initService(this.plantaId).then(() =>
                    this.informeService
                      .getInformesDePlanta(this.plantaId)
                      .pipe(
                        take(1),
                        // obtenemos los informes de la planta
                        switchMap((informes) => {
                          this.informes = informes;

                          // evitamos cargar los informes dobles al navegar atras y volver
                          if (this.informesIdList.length === 0) {
                            // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                            this.informes.forEach((informe) => this._informesIdList.push(informe.id));
                            this.informesIdList$.next(this._informesIdList);
                          }
                          // obtenemos todos los seguidores
                          return this.seguidorService.getSeguidoresPlanta$(this.plantaId);
                        }),
                        take(1)
                      )
                      .subscribe((segs) => {
                        this.allFilterableElements = segs;

                        // iniciamos filter service
                        this.filterService.initService(segs, true, this.sharedId).then((filtersInit) => {
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
  }

  private getNumGlobalCoords(anoms: Anomalia[]): number {
    let numGlobalCoords = anoms[0].globalCoords.length - 1;
    for (let index = anoms[0].globalCoords.length - 1; index >= 0; index--) {
      if (anoms.filter((anom) => anom.globalCoords[index] !== null).length > 0) {
        numGlobalCoords = numGlobalCoords--;
      }
    }
    return numGlobalCoords;
  }

  private setMaeInformesPlanta(seguidores: Seguidor[]) {
    this.informes.forEach((informe) => {
      // tslint:disable-next-line: triple-equals
      if (informe.mae == 0 || informe.mae === undefined || informe.mae === null) {
        const seguidoresInforme = seguidores.filter((seg) => seg.informeId === informe.id);
        let mae = 0;
        seguidoresInforme.forEach((seg) => (mae = mae + seg.mae));
        informe.mae = mae;

        this.informeService.updateInforme(informe);
      }
    });
  }

  private setCCInformesPlanta(seguidores: Seguidor[]) {
    this.informes.forEach((informe) => {
      // tslint:disable-next-line: triple-equals
      if (informe.cc == 0 || informe.cc === undefined || informe.cc === null) {
        const seguidoresInforme = seguidores.filter((seg) => seg.informeId === informe.id);
        let cc = 0;
        seguidoresInforme.forEach((seg) => (cc = cc + seg.celsCalientes));
        informe.cc = cc / seguidores.length;

        this.informeService.updateInforme(informe);
      }
    });
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
    this.allFilterableElements = [];
    this.plantaFija = false;
  }

  getHostname(): string {
    return this.window.location.hostname;
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

  get thereAreZones() {
    return this._thereAreZones;
  }

  set thereAreZones(value: boolean) {
    this._thereAreZones = value;
    this.thereAreZones$.next(value);
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
}
