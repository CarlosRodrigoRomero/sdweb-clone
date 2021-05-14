import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SeguidorViewService {
  private _seguidorViewOpened = false;
  public seguidorViewOpened$ = new BehaviorSubject<boolean>(this._seguidorViewOpened);

  constructor() {}

  get seguidorViewOpened() {
    return this._seguidorViewOpened;
  }

  set seguidorViewOpened(value: boolean) {
    this._seguidorViewOpened = value;
    this.seguidorViewOpened$.next(value);
  }
}
