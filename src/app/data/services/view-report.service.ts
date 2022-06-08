import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewReportService {
  private _toggleViewSelected = 0;
  toggleViewSelected$ = new BehaviorSubject<number>(this._toggleViewSelected);

  constructor() {}

  get toggleViewSelected() {
    return this._toggleViewSelected;
  }

  set toggleViewSelected(selected: number) {
    this._toggleViewSelected = selected;
    this.toggleViewSelected$.next(selected);
  }
}
