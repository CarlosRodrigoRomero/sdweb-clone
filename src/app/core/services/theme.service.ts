import { Injectable, HostBinding } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _themeSelected: string = 'light-theme';
  public themeSelected$ = new BehaviorSubject<string>(this._themeSelected);

  constructor(public overlayContainer: OverlayContainer) {}

  get themeSelected() {
    return this._themeSelected;
  }

  set themeSelected(value: string) {
    this._themeSelected = value;
    this.themeSelected$.next(value);
  }
}
