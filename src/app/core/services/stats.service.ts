import { Injectable } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { BehaviorSubject } from 'rxjs';

import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _loadStats = false;
  loadStats$ = new BehaviorSubject<boolean>(this._loadStats);
  allElems = this.reportControlService.allFilterableElements;
  informesIdList: string[] = this.reportControlService.informesIdList;
  dateLabels: string[] = [];
  private _loadCCyGradChart = true;
  loadCCyGradChart$ = new BehaviorSubject<boolean>(this._loadCCyGradChart);
  private sidenav: MatSidenav;

  constructor(private reportControlService: ReportControlService, private informeService: InformeService) {}

  initService() {
    this.informeService.getDateLabelsInformes(this.informesIdList).subscribe((dateLabels) => {
      this.dateLabels = dateLabels;

      this.initialized$.next(true);
    });

    return this.initialized$;
  }

  setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  closeStatsSidenav() {
    return this.sidenav.toggle();
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
