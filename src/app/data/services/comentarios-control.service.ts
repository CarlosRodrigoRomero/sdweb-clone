import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { Anomalia } from '@core/models/anomalia';

@Injectable({
  providedIn: 'root',
})
export class ComentariosControlService {
  private _sidenavOpened = true;
  sidenavOpened$ = new BehaviorSubject<boolean>(this._sidenavOpened);
  private _anomaliaSelected: Anomalia = undefined;
  anomaliaSelected$ = new BehaviorSubject<Anomalia>(this._anomaliaSelected);
  private _dataLoaded = false;
  dataLoaded$ = new BehaviorSubject<boolean>(this._dataLoaded);
  private _tipoComentarioSelected = 'anomalia';
  tipoComentarioSelected$ = new BehaviorSubject<string>(this._tipoComentarioSelected);
  private _vistaSelected = 'list';
  vistaSelected$ = new BehaviorSubject<string>(this._vistaSelected);

  constructor() {}

  get sidenavOpened(): boolean {
    return this._sidenavOpened;
  }

  set sidenavOpened(value: boolean) {
    this._sidenavOpened = value;
    this.sidenavOpened$.next(value);
  }

  get anomaliaSelected(): Anomalia {
    return this._anomaliaSelected;
  }

  set anomaliaSelected(value: Anomalia) {
    this._anomaliaSelected = value;
    this.anomaliaSelected$.next(value);
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
