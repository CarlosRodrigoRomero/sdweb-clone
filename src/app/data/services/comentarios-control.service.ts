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
  public dataLoaded$ = new BehaviorSubject<boolean>(this._dataLoaded);

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
}
