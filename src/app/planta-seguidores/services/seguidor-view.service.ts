import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { SeguidoresControlService } from './seguidores-control.service';
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
  private _anomaliaHovered: Anomalia = undefined;
  public anomaliaHovered$ = new BehaviorSubject<Anomalia>(this._anomaliaHovered);

  constructor(private seguidoresControlService: SeguidoresControlService) {}

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

  get anomaliaHovered() {
    return this._anomaliaHovered;
  }

  set anomaliaHovered(value: Anomalia) {
    this._anomaliaHovered = value;
    this.anomaliaHovered$.next(value);
  }
}
