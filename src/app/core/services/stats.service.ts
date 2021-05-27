import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private _loadStats = false;
  loadStats$ = new BehaviorSubject<boolean>(this._loadStats);

  constructor() {}

  get loadStats() {
    return this._loadStats;
  }

  set loadStats(value: boolean) {
    this._loadStats = value;
    this.loadStats$.next(value);
  }
}
