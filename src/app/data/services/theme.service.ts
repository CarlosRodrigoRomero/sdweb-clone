import { Injectable, HostBinding } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { BehaviorSubject } from 'rxjs';

import { LocalStorageService } from '@data/services/local-storage.service';

import { COLOR } from '@data/constants/color';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _themeSelected: string = 'light-theme';
  themeSelected$ = new BehaviorSubject<string>(this._themeSelected);
  textColor = COLOR.light_on_background;
  surfaceColor = COLOR.light_surface;

  constructor(public overlayContainer: OverlayContainer, private localStorageService: LocalStorageService) {
    const themeLocal = this.localStorageService.get('theme');
    if (themeLocal !== undefined && themeLocal !== null) {
      this.themeSelected = themeLocal;
    }
  }

  applyTheme(theme: string): void {
    if (theme === 'dark-theme') {
      this.textColor = COLOR.dark_on_background;
      this.surfaceColor = COLOR.dark_surface;
    } else {
      this.textColor = COLOR.light_on_background;
      this.surfaceColor = COLOR.light_surface;
    }
  }

  get themeSelected() {
    return this._themeSelected;
  }

  set themeSelected(value: string) {
    // guardamos el tema seleccionado en local para que quede seteado
    this.localStorageService.set('theme', value);

    this._themeSelected = value;
    this.themeSelected$.next(value);
  }

  getColorsByTheme(theme: string) {
    let highlightColor = COLOR.dark_orange;
    let neutralColor = COLOR.dark_neutral;
    if (theme === 'dark-theme') {
      highlightColor = COLOR.dark_orange;
      neutralColor = COLOR.dark_neutral;
    } else {
      highlightColor = COLOR.light_orange;
      neutralColor = COLOR.light_neutral;
    }

    return [highlightColor, neutralColor];
  }
}
