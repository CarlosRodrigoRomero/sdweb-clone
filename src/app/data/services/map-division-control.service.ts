import { Injectable } from '@angular/core';
import { MapDivision } from '@core/models/mapDivision';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapDivisionControlService {
  private _mapDivisionHovered: MapDivision = undefined;
  mapDivisionHovered$ = new BehaviorSubject<MapDivision>(this._mapDivisionHovered);
  private _mapDivisionSelected: MapDivision = undefined;
  mapDivisionSelected$ = new BehaviorSubject<MapDivision>(this._mapDivisionSelected);

  constructor() {}

  resetService() {
    this.mapDivisionHovered = undefined;
    this.mapDivisionSelected = undefined;
  }

  ////////////////////////////////////////////////////////////

  get mapDivisionHovered() {
    return this._mapDivisionHovered;
  }

  set mapDivisionHovered(value: MapDivision) {
    this._mapDivisionHovered = value;
    this.mapDivisionHovered$.next(value);
  }

  get mapDivisionSelected() {
    return this._mapDivisionSelected;
  }

  set mapDivisionSelected(value: MapDivision) {
    this._mapDivisionSelected = value;
    this.mapDivisionSelected$.next(value);
  }
}
