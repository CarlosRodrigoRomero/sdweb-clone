import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { FilterService } from '@core/services/filter.service';
import { ShareReportService } from '@core/services/share-report.service';
import { InformeService } from '@core/services/informe.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { SeguidorService } from '@core/services/seguidor.service';

import { WINDOW } from '../../window.providers';

import { ParamsFilterShare } from '@core/models/paramsFilterShare';

import { FilterableElement } from '@core/models/filtrableInterface';

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
  private informesList: string[] = [];
  public informesList$ = new BehaviorSubject<string[]>(this.informesList);
  private _initialized = false;
  public initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _mapLoaded = false;
  public mapLoaded$ = new BehaviorSubject<boolean>(this._mapLoaded);
  public criterioCoA;
  private _allFilterableElements: FilterableElement[] = [];
  public allFilterableElements$ = new BehaviorSubject<FilterableElement[]>(this._allFilterableElements);
  private _filteredElements: FilterableElement[] = [];
  public filteredElements$ = new BehaviorSubject<FilterableElement[]>(this._filteredElements);
  public plantaFija = false;

  constructor(
    private router: Router,
    private shareReportService: ShareReportService,
    private filterService: FilterService,
    private informeService: InformeService,
    private anomaliaService: AnomaliaService,
    private seguidorService: SeguidorService,
    @Inject(WINDOW) private window: Window
  ) {}

  initService(): Observable<boolean> {
    ////////////////////// PLANTA FIJA ////////////////////////
    if (this.router.url.includes('fixed')) {
      this.plantaFija = true;

      if (!this.router.url.includes('shared')) {
        // obtenemos plantaId de la url
        this.plantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

        // iniciamos anomalia service antes de obtener las anomalias
        this.anomaliaService
          .initService(this.plantaId)
          .pipe(
            switchMap(() => this.informeService.getInformesDePlanta(this.plantaId)),
            // obtenemos los informes de la planta
            switchMap((informesId) => {
              // ordenamos los informes de menos a mas reciente y los añadimos a la lista
              informesId
                .sort((a, b) => a.fecha - b.fecha)
                .forEach((informe) => {
                  this.informesList.push(informe.id);
                });
              this.informesList$.next(this.informesList);

              this.selectedInformeId = this.informesList[this.informesList.length - 1];

              // obtenemos todas las anomalías
              return this.anomaliaService.getAnomaliasPlanta$(this.plantaId);
            }),
            take(1),
            switchMap((anoms) => {
              this.allFilterableElements = anoms;

              // iniciamos filter service
              return this.filterService.initService(this.plantaId, this.plantaFija, anoms);
            })
          )
          .subscribe((init) => (this.initialized = init));
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
                this.anomaliaService
                  .initService(this.plantaId)
                  .pipe(
                    switchMap(() => this.anomaliaService.getAnomaliasPlanta$(this.plantaId)),
                    take(1),
                    switchMap((anoms) => {
                      this.allFilterableElements = anoms;

                      // iniciamos filter service
                      return this.filterService.initService(this.plantaId, true, anoms, true, this.sharedId);
                    })
                  )
                  // iniciamos filter service
                  .subscribe((init) => (this.initialized = init));
              } else {
                //////////////////// FILTERABLE SHARED REPORT /////////////////////////
                let initAnomService = false;
                // iniciamos anomalia service antes de obtener las anomalias
                this.anomaliaService
                  .initService(this.plantaId)
                  .pipe(
                    switchMap((init) => {
                      initAnomService = init;

                      return this.informeService.getInformesDePlanta(this.plantaId);
                    }),
                    // obtenemos los informes de la planta
                    switchMap((informesId) => {
                      // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                      informesId
                        .sort((a, b) => a.fecha - b.fecha)
                        .forEach((informe) => {
                          this.informesList.push(informe.id);
                        });
                      this.informesList$.next(this.informesList);

                      // comprobamos que anomalia service hay terminado de iniciarse
                      if (initAnomService) {
                        // obtenemos todas las anomalías
                      return this.anomaliaService.getAnomaliasPlanta$(this.plantaId);
                      }
                    }),
                    take(1),
                    switchMap((anoms) => {
                      this.allFilterableElements = anoms;

                      // iniciamos filter service
                      return this.filterService.initService(this.plantaId, true, anoms, true, this.sharedId);
                    })
                  )
                  .subscribe((init) => (this.initialized = init));
              }
            } else {
              console.log('No existe el documento');
            }
          })
          .catch((error) => console.log('Error accediendo al documento: ', error));
      }
    } else {
      /////////////////// PLANTA SEGUIDORES //////////////////////
      if (!this.router.url.includes('shared')) {
        // obtenemos plantaId de la url
        this.plantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

        // iniciamos anomalia service para cargar los criterios la planta
        this.anomaliaService
          .initService(this.plantaId)
          .pipe(
            switchMap(() => this.informeService.getInformesDePlanta(this.plantaId)),
            // obtenemos los informes de la planta
            switchMap((informesId) => {
              // ordenamos los informes de menos a mas reciente y los añadimos a la lista
              informesId
                .sort((a, b) => a.fecha - b.fecha)
                .forEach((informe) => {
                  this.informesList.push(informe.id);
                });
              this.informesList$.next(this.informesList);

              this.selectedInformeId = this.informesList[this.informesList.length - 1];

              // obtenemos todos los seguidores
              return this.seguidorService.getSeguidoresPlanta$(this.plantaId);
            }),
            take(1),
            switchMap((segs) => {
              this.allFilterableElements = segs;

              // iniciamos filter service
              return this.filterService.initService(this.plantaId, this.plantaFija, segs);
            })
          )
          .subscribe((init) => (this.initialized = init));
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
                this.anomaliaService
                  .initService(this.plantaId)
                  .pipe(
                    switchMap(() => this.seguidorService.getSeguidoresPlanta$(this.plantaId)),
                    take(1),
                    switchMap((segs) => {
                      this.allFilterableElements = segs;

                      // iniciamos filter service
                      return this.filterService.initService(this.plantaId, true, segs, this.plantaFija, this.sharedId);
                    })
                  )
                  // iniciamos filter service
                  .subscribe((init) => (this.initialized = init));
              } else {
                //////////////////// FILTERABLE SHARED REPORT /////////////////////////
                let initAnomService = false;
                // iniciamos anomalia service para cargar los criterios la planta
                this.anomaliaService
                  .initService(this.plantaId)
                  .pipe(
                    switchMap((init) => {
                      initAnomService = init;

                      return this.informeService.getInformesDePlanta(this.plantaId);
                    }),
                    // obtenemos los informes de la planta
                    switchMap((informes) => {
                      // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                      informes
                        .sort((a, b) => a.fecha - b.fecha)
                        .forEach((informe) => {
                          this.informesList.push(informe.id);
                        });
                      this.informesList$.next(this.informesList);

                      // comprobamos que anomalia service hay terminado de iniciarse
                      if (initAnomService) {
                        // obtenemos todos los seguidores
                        return this.seguidorService.getSeguidoresPlanta$(this.plantaId);
                      }
                    }),
                    take(1),
                    switchMap((segs) => {
                      this.allFilterableElements = segs;

                      // iniciamos filter service
                      return this.filterService.initService(this.plantaId, true, segs, this.plantaFija, this.sharedId);
                    })
                  )
                  .subscribe((init) => (this.initialized = init));
              }
            } else {
              console.log('No existe el documento');
            }
          })
          .catch((error) => console.log('Error accediendo al documento: ', error));
      }
    }

    return this.initialized$;
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
}
