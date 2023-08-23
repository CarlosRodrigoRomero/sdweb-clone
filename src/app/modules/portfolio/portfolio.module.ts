import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PortfolioRoutingModule } from './portfolio-routing.module';
import { SharedModule } from '@shared/shared.module';

import { PortfolioPrincipalDataContainerComponent } from './containers/portfolio-principal-data-container/portfolio-principal-data-container.component';

import { PortfolioSummaryComponent } from './components/portfolio-summary/portfolio-summary.component';
import { DownloadExcelPortfolioComponent } from './components/download-excel-portfolio/download-excel-portfolio.component';

@NgModule({
  declarations: [PortfolioSummaryComponent, DownloadExcelPortfolioComponent, PortfolioPrincipalDataContainerComponent],
  imports: [CommonModule, PortfolioRoutingModule, SharedModule],
  exports: [PortfolioPrincipalDataContainerComponent],
})
export class PortfolioModule {}
