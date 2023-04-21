import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { ResetServices } from '@data/services/reset-services.service';

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

  constructor(public portfolioControlService: PortfolioControlService, private resetServices: ResetServices) {}

  ngOnInit() {
    this.portfolioControlService.initService().then((res) => (this.mapLoaded = res));
  }

  ngOnDestroy() {
    // cancelamos las suscripciones
    this.subscription.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.resetServices.resetAllServices();
  }
}
