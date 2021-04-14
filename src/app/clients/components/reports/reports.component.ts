import { Component, OnInit } from '@angular/core';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  numPlantas = 0;
  potenciaTotal = 0;
  public mapLoaded = false;

  constructor(
    public auth: AuthService,
    private plantaService: PlantaService,
    private portfolioControlService: PortfolioControlService
  ) {}

  ngOnInit() {
    this.auth.user$.subscribe((user) =>
      this.portfolioControlService.initService(user).subscribe((init) => (this.mapLoaded = init))
    );

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
}
