import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { SeguidoresControlService } from '../services/seguidores-control.service';

import { Anomalia } from '@core/models/anomalia';

@Injectable({
  providedIn: 'root',
})
export class SeguidorViewService {
  private _sidenav: MatSidenav;
  private _imageSelected = 0;
  public imageSelected$ = new BehaviorSubject<number>(this._imageSelected);
  private _anomaliaSelected: Anomalia = undefined;
  public anomaliaSelected$ = new BehaviorSubject<Anomalia>(this._anomaliaSelected);
  private _prevAnomaliaSelected: Anomalia = undefined;
  public prevAnomaliaSelected$ = new BehaviorSubject<Anomalia>(this._prevAnomaliaSelected);
  private _anomaliaHovered: Anomalia = undefined;
  public anomaliaHovered$ = new BehaviorSubject<Anomalia>(this._anomaliaHovered);
  private _visualCanvas: any = undefined;
  private _thermalCanvas: any = undefined;
  private _imagesLoaded = false;
  public imagesLoaded$ = new BehaviorSubject<boolean>(this._imagesLoaded);

  constructor(private seguidoresControlService: SeguidoresControlService) {}

  resetViewValues() {
    this.seguidoresControlService.seguidorSelected = undefined;
    this.anomaliaSelected = undefined;
    this.seguidoresControlService.urlVisualImageSeguidor = undefined;
    this.seguidoresControlService.urlThermalImageSeguidor = undefined;
    this.imageSelected = 0;
    if (this.visualCanvas !== undefined) {
      this.visualCanvas.clear();
    }
    this.seguidoresControlService.imageExist = true;
  }

  get sidenav() {
    return this._sidenav;
  }

  set sidenav(value: MatSidenav) {
    this._sidenav = value;
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

  get visualCanvas() {
    return this._visualCanvas;
  }

  set visualCanvas(value: any) {
    this._visualCanvas = value;
  }

  get thermalCanvas() {
    return this._thermalCanvas;
  }

  set thermalCanvas(value: any) {
    this._thermalCanvas = value;
  }

  get imagesLoaded() {
    return this._imagesLoaded;
  }

  set imagesLoaded(value: boolean) {
    this._imagesLoaded = value;
    this.imagesLoaded$.next(value);
  }
}
