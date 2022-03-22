import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { OlMapService } from '@core/services/ol-map.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  dataLoaded = false;

  private subscription: Subscription = new Subscription();

  constructor(private portfolioControlService: PortfolioControlService, private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.portfolioControlService.initService().then((res) => (this.dataLoaded = res));
  }

  ngOnDestroy() {
    // cancelamos las suscripciones
    this.subscription.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.portfolioControlService.resetService();
    this.olMapService.resetService();
  }
}
