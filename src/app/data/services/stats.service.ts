import { Injectable } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { BehaviorSubject, Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _loadStats = false;
  loadStats$ = new BehaviorSubject<boolean>(this._loadStats);
  informesIdList: string[];
  dateLabels: string[] = [];
  private _loadCCyGradChart = true;
  loadCCyGradChart$ = new BehaviorSubject<boolean>(this._loadCCyGradChart);
  private sidenav: MatSidenav;

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService, private informeService: InformeService) {}

  initService() {
    this.informesIdList = this.reportControlService.informesIdList;

    this.subscriptions.add(
      this.informeService.getDateLabelsInformes(this.informesIdList).subscribe((dateLabels) => {
        this.dateLabels = dateLabels;

        this.initialized$.next(true);
      })
    );

    return this.initialized$;
  }

  setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  closeStatsSidenav() {
    return this.sidenav.toggle();
  }

  resetService() {
    this._initialized = false;
    this.loadStats = false;
    this.informesIdList = undefined;
    this.dateLabels = [];
    this.loadCCyGradChart = true;
    this.sidenav = undefined;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  get loadStats() {
    return this._loadStats;
  }

  set loadStats(value: boolean) {
    this._loadStats = value;
    this.loadStats$.next(value);
  }

  get loadCCyGradChart() {
    return this._loadCCyGradChart;
  }

  set loadCCyGradChart(value: boolean) {
    this._loadCCyGradChart = value;
    this.loadCCyGradChart$.next(value);
  }
}
