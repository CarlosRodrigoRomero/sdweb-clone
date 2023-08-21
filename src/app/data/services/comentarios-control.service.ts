import { Injectable } from '@angular/core';

import { BehaviorSubject, Subscription } from 'rxjs';

import { FilterService } from './filter.service';
import { ReportControlService } from './report-control.service';
import { ComentariosService } from './comentarios.service';

import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';
@Injectable({
  providedIn: 'root',
})
export class ComentariosControlService {
  private _listOpened = false;
  listOpened$ = new BehaviorSubject<boolean>(this._listOpened);
  private _infoOpened = false;
  infoOpened$ = new BehaviorSubject<boolean>(this._infoOpened);
  private _anomaliaSelected: Anomalia = undefined;
  anomaliaSelected$ = new BehaviorSubject<Anomalia>(this._anomaliaSelected);
  private _prevAnomaliaSelected: Anomalia = undefined;
  prevAnomaliaSelected$ = new BehaviorSubject<Anomalia>(this._prevAnomaliaSelected);
  private _seguidorSelected: Seguidor = undefined;
  seguidorSelected$ = new BehaviorSubject<Seguidor>(this._seguidorSelected);
  private _dataLoaded = false;
  dataLoaded$ = new BehaviorSubject<boolean>(this._dataLoaded);
  private _tipoComentarioSelected = 'anomalia';
  tipoComentarioSelected$ = new BehaviorSubject<string>(this._tipoComentarioSelected);
  vistas = ['map', 'list'];
  private _vistaSelected = 'list';
  vistaSelected$ = new BehaviorSubject<string>(this._vistaSelected);
  tiposComentarios = ['anomalia', 'iv'];
  private _anomalias: Anomalia[] = [];
  anomalias$ = new BehaviorSubject<Anomalia[]>(this._anomalias);
  private _seguidores: Seguidor[] = [];
  seguidores$ = new BehaviorSubject<Seguidor[]>(this._seguidores);

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private comentariosService: ComentariosService
  ) {}

  initService(): Promise<void> {
    return new Promise((initService) => {
      this.anomalias = [];
      if (this.reportControlService.plantaFija) {
        this.anomalias = this.filterService.filteredElements as Anomalia[];
      } else {
        this.seguidores = this.filterService.filteredElements.filter(
          (elem) => (elem as Seguidor).anomaliasCliente.length > 0
        ) as Seguidor[];

        this.filterService.filteredElements.forEach((seg) =>
          this.anomalias.push(...(seg as Seguidor).anomaliasCliente)
        );
      }

      this.subscriptions.add(
        this.comentariosService
          .getComentariosInforme(this.reportControlService.selectedInformeId)
          .subscribe((comentarios) => {
            if (this.reportControlService.plantaFija) {
              const anomalias = this.anomalias;
              anomalias.forEach((anom) => {
                const comentariosAnom = comentarios.filter((com) => com.anomaliaId === anom.id);

                anom.comentarios = comentariosAnom;
              });
              this.anomalias = anomalias;
            } else {
              const seguidores = this.seguidores;
              seguidores.map((seg) => {
                seg.anomaliasCliente.forEach((anom) => {
                  const comentariosAnom = comentarios.filter((com) => com.anomaliaId === anom.id);

                  anom.comentarios = comentariosAnom;
                });
              });
              this.seguidores = seguidores;

              const anomaliasSeguidores: Anomalia[] = [];
              this.seguidores.forEach((seg) => anomaliasSeguidores.push(...(seg as Seguidor).anomaliasCliente));
              this.anomalias = anomaliasSeguidores;
            }

            initService();
          })
      );
    });
  }

  resetService() {
    this.listOpened = false;
    this.infoOpened = false;
    this.anomaliaSelected = undefined;
    this.prevAnomaliaSelected = undefined;
    this.seguidorSelected = undefined;
    this.dataLoaded = false;
    this.tipoComentarioSelected = 'anomalia';
    this.vistas = ['map', 'list'];
    this.vistaSelected = 'list';
    this.tiposComentarios = ['anomalia', 'iv'];
    this.anomalias = [];
    this.seguidores = [];

    this.subscriptions.unsubscribe();
  }

  get listOpened(): boolean {
    return this._listOpened;
  }

  set listOpened(value: boolean) {
    this._listOpened = value;
    this.listOpened$.next(value);
  }

  get infoOpened(): boolean {
    return this._infoOpened;
  }

  set infoOpened(value: boolean) {
    this._infoOpened = value;
    this.infoOpened$.next(value);
  }

  get anomaliaSelected(): Anomalia {
    return this._anomaliaSelected;
  }

  set anomaliaSelected(value: Anomalia) {
    this._anomaliaSelected = value;
    this.anomaliaSelected$.next(value);
  }

  get prevAnomaliaSelected() {
    return this._prevAnomaliaSelected;
  }

  set prevAnomaliaSelected(value: Anomalia) {
    this._prevAnomaliaSelected = value;
    this.prevAnomaliaSelected$.next(value);
  }

  get seguidorSelected(): Seguidor {
    return this._seguidorSelected;
  }

  set seguidorSelected(value: Seguidor) {
    this._seguidorSelected = value;
    this.seguidorSelected$.next(value);
  }

  get dataLoaded(): boolean {
    return this._dataLoaded;
  }

  set dataLoaded(value: boolean) {
    this._dataLoaded = value;
    this.dataLoaded$.next(value);
  }

  get tipoComentarioSelected(): string {
    return this._tipoComentarioSelected;
  }

  set tipoComentarioSelected(value: string) {
    this._tipoComentarioSelected = value;
    this.tipoComentarioSelected$.next(value);
  }

  get vistaSelected(): string {
    return this._vistaSelected;
  }

  set vistaSelected(value: string) {
    this._vistaSelected = value;
    this.vistaSelected$.next(value);
  }

  get anomalias(): Anomalia[] {
    return this._anomalias;
  }

  set anomalias(value: Anomalia[]) {
    this._anomalias = value;
    this.anomalias$.next(value);
  }

  get seguidores(): Seguidor[] {
    return this._seguidores;
  }

  set seguidores(value: Seguidor[]) {
    this._seguidores = value;
    this.seguidores$.next(value);
  }
}
