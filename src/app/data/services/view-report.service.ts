import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewReportService {
  private _reportViewSelected = 0;
  reportViewSelected$ = new BehaviorSubject<number>(this._reportViewSelected);

  private _sliderTemporal: number = 100;
  sliderTemporal$ = new BehaviorSubject<number>(this._sliderTemporal);

  constructor() {}

  resetService() {
    this.reportViewSelected = 0;
    this.sliderTemporal = 100;
  }

  get reportViewSelected() {
    return this._reportViewSelected;
  }

  set reportViewSelected(selected: number) {
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
}
