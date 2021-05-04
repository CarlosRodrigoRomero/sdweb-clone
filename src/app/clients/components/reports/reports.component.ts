import { Component, OnDestroy, OnInit } from '@angular/core';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  numPlantas = 0;
  potenciaTotal = 0;
  public mapLoaded = false;
  private subscription: Subscription = new Subscription();

  constructor(private portfolioControlService: PortfolioControlService) {}

  ngOnInit() {
    this.portfolioControlService.initService().subscribe((init) => (this.mapLoaded = init));

    /* this.auth.user$.subscribe((user) =>
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => {
        plantas.forEach((planta) => {
          if (planta.informes !== undefined && planta.informes.length > 0) {
            const mae = planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae;
            // comprobamos que el informe tiene "mae"
            if (mae !== undefined) {
              this.numPlantas++;
              this.potenciaTotal += planta.potencia;
            }
          }
        });
      })
    ); */
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
