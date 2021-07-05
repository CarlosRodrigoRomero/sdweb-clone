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
  }
}
