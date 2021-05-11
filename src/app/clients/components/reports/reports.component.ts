import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { PortfolioControlService } from '@core/services/portfolio-control.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  providers: [PortfolioControlService],
})
export class ReportsComponent implements OnInit, OnDestroy {
  numPlantas = 0;
  potenciaTotal = 0;
  public mapLoaded = false;
  private subscription: Subscription = new Subscription();

  constructor(private portfolioControlService: PortfolioControlService) {}

  ngOnInit() {
    this.subscription.add(this.portfolioControlService.initService().subscribe((init) => (this.mapLoaded = init)));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
