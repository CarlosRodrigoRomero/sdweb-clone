import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { MatSidenav } from '@angular/material/sidenav';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  informesIdList: string[];
  dateLabels: string[] = [];
  private _loadCCyGradChart = true;
  loadCCyGradChart$ = new BehaviorSubject<boolean>(this._loadCCyGradChart);
  private sidenav: MatSidenav;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  closeStatsSidenav() {
    return this.sidenav.toggle();
  }

  resetService() {
    this.informesIdList = undefined;
    this.dateLabels = [];
    this.loadCCyGradChart = true;
    this.sidenav = undefined;
  }

  get loadCCyGradChart() {
    return this._loadCCyGradChart;
  }

  set loadCCyGradChart(value: boolean) {
    this._loadCCyGradChart = value;
    this.loadCCyGradChart$.next(value);
  }
}
