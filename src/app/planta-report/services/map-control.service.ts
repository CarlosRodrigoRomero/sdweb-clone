import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapControlService {
  private _sliderMin: number = 25;
  public sliderMinSource = new BehaviorSubject<number>(this._sliderMin);

  private _sliderMax: number = 70;
  public sliderMaxSource = new BehaviorSubject<number>(this._sliderMax);

  constructor() {}

  get sliderMin() {
    return this._sliderMin;
  }
  get sliderMax() {
    return this._sliderMax;
  }
  set sliderMin(value: number) {
    this._sliderMin = value;
    this.sliderMaxSource.next(value);
  }
  set sliderMax(value: number) {
    this._sliderMax = value;

    this.sliderMinSource.next(value);
  }
}
