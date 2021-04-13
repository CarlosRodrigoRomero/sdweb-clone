import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { FilterService } from '@core/services/filter.service';
import { ShareReportService } from '@core/services/share-report.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { ParamsFilterShare } from '@core/models/paramsFilterShare';
import { GLOBAL } from './global';

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
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _mapLoaded = false;
  public mapLoaded$ = new BehaviorSubject<boolean>(this._mapLoaded);
  public criterioCoA;

  constructor(
    private router: Router,
    private shareReportService: ShareReportService,
    private filterService: FilterService,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private anomaliaService: AnomaliaService
  ) {}

  initService(): Observable<boolean> {
    // comprobamos si es un informe compartido
    if (this.router.url.includes('shared')) {
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

            // iniciamos anomalias service
            this.anomaliaService.initService(this.plantaId);

            if (this.router.url.includes('filterable')) {
              // iniciamos anomalia service antes de obtener las anomalias
              this.anomaliaService
                .initService(this.plantaId)
                .pipe(
                  switchMap(() => this.informeService.getInformesDePlanta(this.plantaId)),
                  // obtenemos los informes de la planta e iniciamos filter service
                  switchMap((informesId) => {
                    // ordenamos los informes de menos a mas reciente y los añadimos a la lista
                    informesId
                      .sort((a, b) => a.fecha - b.fecha)
                      .forEach((informe) => {
                        this.informesList.push(informe.id);
                      });
                    this.informesList$.next(this.informesList);

                    return this.filterService.initService(this.sharedReport, this.plantaId, true, this.sharedId);
                  })
                )
                .subscribe((init) => (this.initialized = init));
            } else {
              // iniciamos anomalia service antes de obtener las anomalias
              this.anomaliaService
                .initService(this.plantaId)
                .pipe(
                  switchMap(() => this.filterService.initService(this.sharedReport, this.plantaId, true, this.sharedId))
                )
                // iniciamos filter service
                .subscribe((init) => (this.initialized = init));
            }
          } else {
            console.log('No existe el documento');
          }
        })
        .catch((error) => console.log('Error accediendo al documento: ', error));
    } else {
      // obtenemos plantaId de la url
      this.plantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

      // obtenemos el criterio de CoA de la planta
      this.plantaService
        .getPlanta(this.plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            if (planta.hasOwnProperty('criterioId')) {
              return this.plantaService.getCriterio(planta.criterioId);
            } else {
              return this.plantaService.getCriterio(GLOBAL.criterioSolardroneId);
            }
          })
        )
        .subscribe((criterio) => (this.anomaliaService.criterioCoA = criterio.critCoA));

      // iniciamos anomalia service antes de obtener las anomalias
      this.anomaliaService
        .initService(this.plantaId)
        .pipe(
          switchMap(() => this.informeService.getInformesDePlanta(this.plantaId)),
          // obtenemos los informes de la planta e iniciamos filter service
          switchMap((informesId) => {
            // ordenamos los informes de menos a mas reciente y los añadimos a la lista
            informesId
              .sort((a, b) => a.fecha - b.fecha)
              .forEach((informe) => {
                this.informesList.push(informe.id);
              });
            this.informesList$.next(this.informesList);

            this.selectedInformeId = this.informesList[this.informesList.length - 1];

            return this.filterService.initService(this.sharedReport, this.plantaId, true);
          })
        )
        .subscribe((init) => (this.initialized = init));
    }

    return this.initialized$;
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
}
