import { Component, OnInit } from '@angular/core';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

@Component({
  selector: 'app-asset-summary',
  templateUrl: './asset-summary.component.html',
  styleUrls: ['./asset-summary.component.css'],
})
export class AssetSummaryComponent implements OnInit {
  numPlantas = 0;
  maeMedio: number;
  potenciaTotal = 0;

  constructor(private plantaService: PlantaService, public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user) =>
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => {
        let sumMae = 0;
        plantas.forEach((planta) => {
          if (planta.informes !== undefined && planta.informes.length > 0) {
            this.numPlantas++;
            const mae = planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae;
            // comprobamos que tengo mae el informe
            if (mae !== undefined) {
              sumMae += mae;
            }
            this.potenciaTotal += planta.potencia;
          }
        });
        this.maeMedio = sumMae / this.numPlantas;
      })
    );

    this.auth.user$.subscribe((user) =>
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => plantas.length)
    );
  }
}
