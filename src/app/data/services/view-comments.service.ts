import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { ReportControlService } from './report-control.service';

@Injectable({
  providedIn: 'root',
})
export class ViewCommentsService {
  zoomShowAnoms = 18;
  zoomShowSmallZones = 16;
  private _thermalLayerVisible = false;
  thermalLayerVisible$ = new BehaviorSubject<boolean>(this._thermalLayerVisible);

  constructor(private reportControlService: ReportControlService) {}

  get thermalLayerVisible() {
    return this._thermalLayerVisible;
  }

  set thermalLayerVisible(value: boolean) {
    this._thermalLayerVisible = value;
    this.thermalLayerVisible$.next(value);
  }
}
