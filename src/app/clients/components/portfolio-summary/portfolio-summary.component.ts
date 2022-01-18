import { Component, OnInit } from '@angular/core';

import { PortfolioControlService } from '@core/services/portfolio-control.service';

@Component({
  selector: 'app-portfolio-summary',
  templateUrl: './portfolio-summary.component.html',
  styleUrls: ['./portfolio-summary.component.css'],
})
export class PortfolioSummaryComponent implements OnInit {
  numPlantas = 0;
  potenciaTotal = 0;

  constructor(private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    // this.numPlantas = this.portfolioControlService.numPlantas;
    this.potenciaTotal = this.portfolioControlService.potenciaTotal;
  }
}
