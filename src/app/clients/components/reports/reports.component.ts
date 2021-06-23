import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { OlMapService } from '@core/services/ol-map.service';

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

  constructor(private portfolioControlService: PortfolioControlService, private olMapService: OlMapService) {}

  ngOnInit() {
    this.subscription.add(this.portfolioControlService.initService().subscribe((init) => (this.mapLoaded = init)));
  }

  ngOnDestroy() {
    // cancelamos las suscripciones
    this.subscription.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.portfolioControlService.resetService();
    this.olMapService.resetService();
  }
}
