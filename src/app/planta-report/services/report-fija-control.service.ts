import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';

import { FilterService } from '@core/services/filter.service';
import { ShareReportService } from '@core/services/share-report.service';
import { MapControlService } from '../services/map-control.service';

@Injectable({
  providedIn: 'root',
})
export class ReportFijaControlService {
  private _sharedReport = false;
  private sharedReport$ = new BehaviorSubject<boolean>(this._sharedReport);
  private sharedId: string;
  private _plantaId: string = undefined;
  public plantaId$ = new BehaviorSubject<string>(this._plantaId);
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _mapLoaded = false;
  public mapLoaded$ = new BehaviorSubject<boolean>(this._mapLoaded);

  constructor(
    private router: Router,
    private shareReportService: ShareReportService,
    private filterService: FilterService,
    private mapControlService: MapControlService
  ) {}

  initService(): Observable<boolean> {
    // comprobamos si es un informe compartido
    if (this.router.url.includes('shared')) {
      this.sharedReport = true;
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
            this.plantaId = doc.data().plantaId;

            const initFilterService = this.filterService.initService(
              this.sharedReport,
              this.plantaId,
              true,
              this.sharedId
            );
            const initMapControlService = this.mapControlService.initService(this.plantaId);

            // iniciamos filter service y map control service
            combineLatest([initFilterService, initMapControlService]).subscribe(([filtSerInit, mapContrInit]) => {
              this.initialized = filtSerInit && mapContrInit;
            });
          } else {
            console.log('No existe el documento');
          }
        })
        .catch((error) => console.log('Error accediendo al documento: ', error));
    } else {
      // obtenemos plantaId de la url
      this.plantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

      const initFilterService = this.filterService.initService(this.sharedReport, this.plantaId, true);
      const initMapControlService = this.mapControlService.initService(this.plantaId);

      // iniciamos filter service
      combineLatest([initFilterService, initMapControlService]).subscribe(([filtSerInit, mapContrInit]) => {
        this.initialized = filtSerInit && mapContrInit;
      });
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

  get plantaId() {
    return this._plantaId;
  }

  set plantaId(value: string) {
    this._plantaId = value;
    this.plantaId$.next(value);
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
