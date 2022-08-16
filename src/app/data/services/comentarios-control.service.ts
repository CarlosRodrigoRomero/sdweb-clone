import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { ReportControlService } from './report-control.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

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
  private _seguidorSelected: Seguidor = undefined;
  seguidorSelected$ = new BehaviorSubject<Seguidor>(this._seguidorSelected);
  private _dataLoaded = false;
  dataLoaded$ = new BehaviorSubject<boolean>(this._dataLoaded);
  private _tipoComentarioSelected = 'anomalia';
  tipoComentarioSelected$ = new BehaviorSubject<string>(this._tipoComentarioSelected);
  vistas = ['map', 'list'];
  private _vistaSelected = 'list';
  vistaSelected$ = new BehaviorSubject<string>(this._vistaSelected);

  constructor(private reportControlService: ReportControlService) {}

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
}
