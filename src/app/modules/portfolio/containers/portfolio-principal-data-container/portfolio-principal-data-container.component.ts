import { Component, OnInit } from '@angular/core';

import { PortfolioControlService } from '@data/services/portfolio-control.service';

@Component({
  selector: 'app-portfolio-principal-data-container',
  templateUrl: './portfolio-principal-data-container.component.html',
  styleUrls: ['./portfolio-principal-data-container.component.css'],
})
export class PortfolioPrincipalDataContainerComponent implements OnInit {
  dataLoaded = false;

  constructor(private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    this.portfolioControlService.initialized$.subscribe((initialized) => (this.dataLoaded = initialized));
  }
}
