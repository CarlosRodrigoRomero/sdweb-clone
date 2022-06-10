import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewReportService {
  private _reportViewSelected = 0;
  reportViewSelected$ = new BehaviorSubject<number>(this._reportViewSelected);

  constructor() {}

  get reportViewSelected() {
    return this._reportViewSelected;
  }

  set reportViewSelected(selected: number) {
    this._reportViewSelected = selected;
    this.reportViewSelected$.next(selected);
  }
}
