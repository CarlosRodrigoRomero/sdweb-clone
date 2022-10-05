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

  private _simplifiedView = false;
  simplifiedView$ = new BehaviorSubject<boolean>(this._simplifiedView);

  constructor() {}

  resetService() {
    this.reportViewSelected = 'tipo';
    this.sliderTemporal = 100;
    this.simplifiedView = false;
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

  get simplifiedView() {
    return this._simplifiedView;
  }
  set simplifiedView(value: boolean) {
    this._simplifiedView = value;
    this.simplifiedView$.next(value);
  }
}
