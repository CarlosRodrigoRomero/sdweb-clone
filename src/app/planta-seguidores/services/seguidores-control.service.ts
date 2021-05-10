import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { Seguidor } from '@core/models/seguidor';

@Injectable({
  providedIn: 'root',
})
export class SeguidoresControlService {
  private _seguidorHovered: Seguidor = undefined;
  public seguidorHovered$ = new BehaviorSubject<Seguidor>(this._seguidorHovered);

  constructor() {}

  get seguidorHovered() {
    return this._seguidorHovered;
  }

  set seguidorHovered(value: Seguidor) {
    this._seguidorHovered = value;
    this.seguidorHovered$.next(value);
  }
}
