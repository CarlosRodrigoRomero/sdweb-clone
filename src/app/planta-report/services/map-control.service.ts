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

  private _sliderYear: number = 100;
  public sliderYearSource = new BehaviorSubject<number>(this._sliderYear);

  constructor() {}

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
  get sliderYear() {
    return this._sliderYear;
  }
  set sliderYear(value: number) {
    this._sliderYear = value;

    this.sliderYearSource.next(value);
  }
}
