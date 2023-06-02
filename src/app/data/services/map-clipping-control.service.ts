import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { MapClipping } from '@core/models/mapClipping';

@Injectable({
  providedIn: 'root',
})
export class MapClippingControlService {
  private _mapClippingSelected: MapClipping = undefined;
  mapClippingSelected$ = new BehaviorSubject<MapClipping>(this._mapClippingSelected);
  private _mapClippingToMerge: MapClipping[] = [];
  mapClippingToMerge$ = new BehaviorSubject<MapClipping[]>(this._mapClippingToMerge);

  constructor() {}

  get mapClippingSelected() {
    return this._mapClippingSelected;
  }

  set mapClippingSelected(value: MapClipping) {
    this._mapClippingSelected = value;
    this.mapClippingSelected$.next(value);
  }

  get mapClippingToMerge() {
    return this._mapClippingToMerge;
  }

  set mapClippingToMerge(value: MapClipping[]) {
    this._mapClippingToMerge = value;
    this.mapClippingToMerge$.next(value);
  }
}
