import { Injectable } from '@angular/core';

import { RawModule } from '@core/models/moduloBruto';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StructuresControlService {
  private _rawModHovered: RawModule = undefined;
  rawModHovered$ = new BehaviorSubject<RawModule>(this._rawModHovered);

  constructor() {}

  get rawModHovered(): RawModule {
    return this._rawModHovered;
  }

  set rawModHovered(value: RawModule) {
    this._rawModHovered = value;
    this.rawModHovered$.next(value);
  }
}
