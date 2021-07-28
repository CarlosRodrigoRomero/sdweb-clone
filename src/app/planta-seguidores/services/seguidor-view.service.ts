import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { Anomalia } from '@core/models/anomalia';

@Injectable({
  providedIn: 'root',
})
export class SeguidorViewService {
  private sidenav: MatSidenav;
  private _imageSelected = 0;
  public imageSelected$ = new BehaviorSubject<number>(this._imageSelected);
  private _anomaliaSelected: Anomalia = undefined;
  public anomaliaSelected$ = new BehaviorSubject<Anomalia>(this._anomaliaSelected);
  private _prevAnomaliaSelected: Anomalia = undefined;
  public prevAnomaliaSelected$ = new BehaviorSubject<Anomalia>(this._prevAnomaliaSelected);
  private _anomaliaHovered: Anomalia = undefined;
  public anomaliaHovered$ = new BehaviorSubject<Anomalia>(this._anomaliaHovered);
  private _imageCanvas: any = undefined;
  private _imageLoaded = false;
  public imageLoaded$ = new BehaviorSubject<boolean>(this._imageLoaded);

  constructor() {}

  public setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  public closeSidenav() {
    return this.sidenav.close();
  }

  get imageSelected() {
    return this._imageSelected;
  }

  set imageSelected(value: number) {
    this._imageSelected = value;
    this.imageSelected$.next(value);
  }

  get anomaliaSelected() {
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

  get anomaliaHovered() {
    return this._anomaliaHovered;
  }

  set anomaliaHovered(value: Anomalia) {
    this._anomaliaHovered = value;
    this.anomaliaHovered$.next(value);
  }

  get imageCanvas() {
    return this._imageCanvas;
  }

  set imageCanvas(value: any) {
    this._imageCanvas = value;
  }

  get imageLoaded() {
    return this._imageLoaded;
  }

  set imageLoaded(value: boolean) {
    this._imageLoaded = value;
    this.imageLoaded$.next(value);
  }
}
