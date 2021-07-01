import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapControlService {
  private _sliderMin: number = 25;
  public sliderMinSource = new BehaviorSubject<number>(this._sliderMin);

  private _sliderMax: number = 75;
  public sliderMaxSource = new BehaviorSubject<number>(this._sliderMax);

  private _sliderTemporal: number = 100;
  public sliderTemporalSource = new BehaviorSubject<number>(this._sliderTemporal);

  private _sliderThermalOpacity: number = 100;
  public sliderThermalOpacitySource = new BehaviorSubject<number>(this._sliderThermalOpacity);

  constructor() {}

  /////////////////
  get sliderMin() {
    return this._sliderMin;
  }
  set sliderMin(value: number) {
    this._sliderMin = value;
    this.sliderMaxSource.next(value);
  }
  /////////////////
  get sliderMax() {
    return this._sliderMax;
  }
  set sliderMax(value: number) {
    this._sliderMax = value;

    this.sliderMinSource.next(value);
  }
  /////////////////
  get sliderTemporal() {
    return this._sliderTemporal;
  }
  set sliderTemporal(value: number) {
    this._sliderTemporal = value;

    this.sliderTemporalSource.next(value);
  }
  /////////////////
  get sliderThermalOpacity() {
    return this._sliderThermalOpacity;
  }
  set sliderThermalOpacity(value: number) {
    this._sliderThermalOpacity = value;

    this.sliderThermalOpacitySource.next(value);
  }
}
