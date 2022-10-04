import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewReportService {
  private _reportViewSelected = 0;
  reportViewSelected$ = new BehaviorSubject<number>(this._reportViewSelected);

  private _sliderTemporal = 100;
  sliderTemporal$ = new BehaviorSubject<number>(this._sliderTemporal);

  private _simplifiedView = false;
  simplifiedView$ = new BehaviorSubject<boolean>(this._simplifiedView);

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

  get simplifiedView() {
    return this._simplifiedView;
  }
  set simplifiedView(value: boolean) {
    this._simplifiedView = value;
    this.simplifiedView$.next(value);
  }
}
