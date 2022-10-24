import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { StatsService } from '@data/services/stats.service';
import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesService } from '@data/services/zones.service';

@Component({
  selector: 'app-planta-stats',
  templateUrl: './planta-stats.component.html',
  styleUrls: ['./planta-stats.component.css'],
})
export class PlantaStatsComponent implements OnInit, OnDestroy {
  thereAreZones: boolean;
  loadCCyGradChart = true;
  plantaDemo = false;
  sharedReport = false;
  portfolioLoaded = false;
  completeView = false;
  thereAreCCs = true;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private statsService: StatsService,
    private portfolioControlService: PortfolioControlService,
    public reportControlService: ReportControlService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    this.portfolioControlService.initService().then((res) => (this.portfolioLoaded = res));

    this.subscriptions.add(this.zonesService.thereAreZones$.subscribe((value) => (this.thereAreZones = value)));

    this.subscriptions.add(this.reportControlService.sharedReport$.subscribe((shared) => (this.sharedReport = shared)));

    this.subscriptions.add(this.statsService.loadCCyGradChart$.subscribe((load) => (this.loadCCyGradChart = load)));

    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      this.plantaDemo = true;
    }

    this.subscriptions.add(
      this.subscriptions.add(this.reportControlService.completeView$.subscribe((value) => (this.completeView = value)))
    );

    this.reportControlService.allAnomalias.filter((anom) => anom.tipo == 8 || anom.tipo == 9).length > 0
      ? (this.thereAreCCs = true)
      : (this.thereAreCCs = false);
  }

  closeSidenav() {
    this.statsService.closeStatsSidenav();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
