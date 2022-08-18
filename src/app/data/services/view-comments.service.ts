import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewCommentsService {
  zoomShowAnoms = 18;
  zoomChangeAnomsView = 22;
  zoomChangeSegsView = 20;
  zoomShowSmallZones = 16;
  private _thermalLayerVisible = false;
  thermalLayerVisible$ = new BehaviorSubject<boolean>(this._thermalLayerVisible);

  constructor() {}

  resetService() {
    this.zoomShowAnoms = 18;
    this.zoomChangeAnomsView = 22;
    this.zoomChangeSegsView = 20;
    this.zoomShowSmallZones = 16;
    this.thermalLayerVisible = false;
  }

  get thermalLayerVisible() {
    return this._thermalLayerVisible;
  }

  set thermalLayerVisible(value: boolean) {
    this._thermalLayerVisible = value;
    this.thermalLayerVisible$.next(value);
  }
}
