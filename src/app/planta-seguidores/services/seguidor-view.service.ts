import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { SeguidoresControlService } from './seguidores-control.service';

@Injectable({
  providedIn: 'root',
})
export class SeguidorViewService {
  private sidenav: MatSidenav;
  private _imageSelected = 0;
  public imageSelected$ = new BehaviorSubject<number>(this._imageSelected);

  constructor(private seguidoresControlService: SeguidoresControlService) {}

  public setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  public closeSidenav() {
    return this.sidenav.close();
  }

  public clearSeguidor() {
    // deseleecionamos seguidor
    this.seguidoresControlService.seguidorSelected = undefined;
    // reiniciamos imagen seleccionada
    this.imageSelected = 0;
  }

  get imageSelected() {
    return this._imageSelected;
  }

  set imageSelected(value: number) {
    this._imageSelected = value;
    this.imageSelected$.next(value);
  }
}
