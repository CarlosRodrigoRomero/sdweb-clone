import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewReportService {
  private _reportViewSelected = 'tipo';
  reportViewSelected$ = new BehaviorSubject<string>(this._reportViewSelected);

  private _sliderTemporal = 100;
  sliderTemporal$ = new BehaviorSubject<number>(this._sliderTemporal);

  private _groupByZonesView = false;
  groupByZonesView$ = new BehaviorSubject<boolean>(this._groupByZonesView);

  constructor() {}

  resetService() {
    this.reportViewSelected = 'tipo';
    this.sliderTemporal = 100;
    this.groupByZonesView = false;
  }

  get reportViewSelected() {
    return this._reportViewSelected;
  }
  set reportViewSelected(selected: string) {
    this._reportViewSelected = selected;
    this.reportViewSelected$.next(selected);
  }

  get sliderTemporal() {
    return this._sliderTemporal;
  }
  set sliderTemporal(value: number) {
    this._sliderTemporal = value;

    this.sliderTemporal$.next(value);
  }

  get groupByZonesView() {
    return this._groupByZonesView;
  }
  set groupByZonesView(value: boolean) {
    this._groupByZonesView = value;
    this.groupByZonesView$.next(value);
  }
}
