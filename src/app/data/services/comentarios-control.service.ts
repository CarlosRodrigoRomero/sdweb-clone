import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ComentariosControlService {
  private _sidenavOpened = true;
  sidenavOpened$ = new BehaviorSubject<boolean>(this._sidenavOpened);

  constructor() {}

  get sidenavOpened(): boolean {
    return this._sidenavOpened;
  }

  set sidenavOpened(value: boolean) {
    this._sidenavOpened = value;
    this.sidenavOpened$.next(value);
  }
}
