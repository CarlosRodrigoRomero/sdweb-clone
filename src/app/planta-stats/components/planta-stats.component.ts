import { Component, OnInit } from '@angular/core';

import { combineLatest } from 'rxjs';

import { StatsService } from '@core/services/stats.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-planta-stats',
  templateUrl: './planta-stats.component.html',
  styleUrls: ['./planta-stats.component.css'],
})
export class PlantaStatsComponent implements OnInit {
  loadStats = false;
  thereAreZones: boolean;
  loadCCyGradChart = true;
  plantaDemo = false;

  constructor(
    private statsService: StatsService,
    private portfolioControlService: PortfolioControlService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    combineLatest([this.portfolioControlService.initService(), this.statsService.loadStats$]).subscribe(
      ([initPortServ, loadStats]) => (this.loadStats = initPortServ && loadStats)
    );

    this.reportControlService.thereAreZones$.subscribe((value) => (this.thereAreZones = value));

    this.statsService.loadCCyGradChart$.subscribe((load) => (this.loadCCyGradChart = load));

    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      this.plantaDemo = true;
    }
  }

  closeSidenav() {
    this.statsService.closeStatsSidenav();
  }
}
