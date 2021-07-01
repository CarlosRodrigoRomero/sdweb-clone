import { Component, OnInit } from '@angular/core';

import { StatsService } from '@core/services/stats.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-planta-stats',
  templateUrl: './planta-stats.component.html',
  styleUrls: ['./planta-stats.component.css'],
})
export class PlantaStatsComponent implements OnInit {
  loadStats = false;

  constructor(private statsService: StatsService, private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    combineLatest([this.portfolioControlService.initService(), this.statsService.loadStats$]).subscribe(
      ([initPortServ, loadStats]) => (this.loadStats = initPortServ && loadStats)
    );
  }
}
