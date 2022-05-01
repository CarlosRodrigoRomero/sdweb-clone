import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { PortfolioControlService } from '@data/services/portfolio-control.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  dataLoaded = false;

  private subscription: Subscription = new Subscription();

  constructor(private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    this.portfolioControlService.initialized$.subscribe((value) => (this.dataLoaded = value));
  }

  ngOnDestroy() {
    // cancelamos las suscripciones
    this.subscription.unsubscribe();
  }
}
