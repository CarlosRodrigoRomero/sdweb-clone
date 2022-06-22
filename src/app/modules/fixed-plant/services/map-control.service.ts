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

  private _sliderThermalOpacity: number = 100;
  public sliderThermalOpacitySource = new BehaviorSubject<number>(this._sliderThermalOpacity);

  constructor() {}

  resetService() {
    this._sliderMin = 25;
    this._sliderMax = 75;
    this._sliderThermalOpacity = 100;
  }

  get sliderMin() {
    return this._sliderMin;
  }
  set sliderMin(value: number) {
    this._sliderMin = value;
    this.sliderMaxSource.next(value);
  }

  get sliderMax() {
    return this._sliderMax;
  }
  set sliderMax(value: number) {
    this._sliderMax = value;

    this.sliderMinSource.next(value);
  }

  get sliderThermalOpacity() {
    return this._sliderThermalOpacity;
  }
  set sliderThermalOpacity(value: number) {
    this._sliderThermalOpacity = value;

    this.sliderThermalOpacitySource.next(value);
  }
}
