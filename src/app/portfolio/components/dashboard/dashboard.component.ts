import { Component, OnInit } from '@angular/core';

import { PortfolioControlService } from '@core/services/portfolio-control.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  dataLoaded = false;

  constructor(private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    this.portfolioControlService.initService().then((res) => (this.dataLoaded = res));
  }
}
