import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { MapClipping } from '@core/models/mapClipping';

@Injectable({
  providedIn: 'root',
})
export class MapClippingControlService {
  private _mapClippingSelected: MapClipping = undefined;
  mapClippingSelected$ = new BehaviorSubject<MapClipping>(this._mapClippingSelected);

  constructor() {}

  get mapClippingSelected() {
    return this._mapClippingSelected;
  }

  set mapClippingSelected(value: MapClipping) {
    this._mapClippingSelected = value;
    this.mapClippingSelected$.next(value);
  }
}
