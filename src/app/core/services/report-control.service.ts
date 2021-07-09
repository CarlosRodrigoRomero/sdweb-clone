import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, concat, Observable } from 'rxjs';
import { delay, flatMap, publish, switchMap, take, takeWhile } from 'rxjs/operators';

import { FilterService } from '@core/services/filter.service';
import { ShareReportService } from '@core/services/share-report.service';
import { InformeService } from '@core/services/informe.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { SeguidorService } from '@core/services/seguidor.service';

import { WINDOW } from '../../window.providers';

import { ParamsFilterShare } from '@core/models/paramsFilterShare';

import { FilterableElement } from '@core/models/filterableInterface';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';

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
            switchMap((informes) => {
              this.informes = informes.sort((a, b) => a.fecha - b.fecha);

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
            take(1),
            switchMap((anoms) => {
              this.allFilterableElements = anoms;

              // iniciamos filter service
              return this.filterService.initService(anoms);
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
                      return this.filterService.initService(anoms, true, this.sharedId);
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
                    switchMap((informes) => {
                      this.informes = informes.sort((a, b) => a.fecha - b.fecha);

                      // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                      this.informes.forEach((informe) => this._informesIdList.push(informe.id));
                      this.informesIdList$.next(this._informesIdList);
                      // TODO: REVISAR
                      // comprobamos que anomalia service hay terminado de iniciarse
                      if (initAnomService) {
                        // obtenemos todas las anomalías
                        return this.anomaliaService.getAnomaliasPlanta$(this.plantaId);
                      }
                      // obtenemos todas las anomalías
                      // return this.anomaliaService.getAnomaliasPlanta$(this.plantaId);
                    }),
                    take(1),
                    switchMap((anoms) => {
                      this.allFilterableElements = anoms;

                      // iniciamos filter service
                      return this.filterService.initService(anoms, true, this.sharedId);
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
            switchMap((informes) => {
              this.informes = informes.sort((a, b) => a.fecha - b.fecha);

              // ordenamos los informes de menos a mas reciente y los añadimos a la lista
              this.informes.forEach((informe) => this._informesIdList.push(informe.id));
              this.informesIdList$.next(this._informesIdList);

              this.selectedInformeId = this._informesIdList[this._informesIdList.length - 1];

              // obtenemos todos los seguidores
              return this.seguidorService.getSeguidoresPlanta$(this.plantaId);
            }),
            take(1),
            switchMap((segs) => {
              this.allFilterableElements = segs;

              // iniciamos filter service
              return this.filterService.initService(segs);
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
                      return this.filterService.initService(segs, this.plantaFija, this.sharedId);
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
                      this.informes = informes.sort((a, b) => a.fecha - b.fecha);

                      // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                      this.informes.forEach((informe) => this._informesIdList.push(informe.id));
                      this.informesIdList$.next(this._informesIdList);

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
                      return this.filterService.initService(segs, this.plantaFija, this.sharedId);
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
}
