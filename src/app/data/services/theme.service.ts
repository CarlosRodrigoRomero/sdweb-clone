import { Injectable, HostBinding } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { BehaviorSubject } from 'rxjs';

import { LocalStorageService } from '@data/services/local-storage.service';

import { COLOR } from '@data/constants/color';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _themeSelected: string = undefined;
  themeSelected$ = new BehaviorSubject<string>(this._themeSelected);
  textColor = COLOR.light_on_background;

  constructor(public overlayContainer: OverlayContainer, private localStorageService: LocalStorageService) {
    const themeLocal = this.localStorageService.get('theme');
    if (themeLocal !== undefined) {
      this.themeSelected = themeLocal;
    } else {
      this.themeSelected = 'ligth-theme';
    }
  }

  applyTheme(theme: string): void {
    if (theme === 'dark-theme') {
      this.textColor = COLOR.dark_on_background;
    } else {
      this.textColor = COLOR.light_on_background;
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
}
