import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewCommentsService {
  zoomChangeView = 18;
  private _thermalLayerVisible = true;
  thermalLayerVisible$ = new BehaviorSubject<boolean>(this._thermalLayerVisible);

  constructor() {}

  get thermalLayerVisible() {
    return this._thermalLayerVisible;
  }

  set thermalLayerVisible(value: boolean) {
    this._thermalLayerVisible = value;
    this.thermalLayerVisible$.next(value);
  }
}
