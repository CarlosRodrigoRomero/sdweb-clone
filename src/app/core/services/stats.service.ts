import { Injectable } from '@angular/core';

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

  constructor(private reportControlService: ReportControlService, private informeService: InformeService) {}

  initService() {
    this.informeService.getDateLabelsInformes(this.informesIdList).subscribe((dateLabels) => {
      this.dateLabels = dateLabels;

      this.initialized$.next(true);
    });

    return this.initialized$;
  }

  get loadStats() {
    return this._loadStats;
  }

  set loadStats(value: boolean) {
    this._loadStats = value;
    this.loadStats$.next(value);
  }
}
