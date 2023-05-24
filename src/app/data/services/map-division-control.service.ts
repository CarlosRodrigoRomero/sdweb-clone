import { Injectable } from '@angular/core';
import { MapDivision } from '@core/models/mapDivision';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapDivisionControlService {
  private _mapDivisionSelected: MapDivision = undefined;
  mapDivisionSelected$ = new BehaviorSubject<MapDivision>(this._mapDivisionSelected);

  constructor() {}

  get mapDivisionSelected() {
    return this._mapDivisionSelected;
  }

  set mapDivisionSelected(value: MapDivision) {
    this._mapDivisionSelected = value;
    this.mapDivisionSelected$.next(value);
  }
}
