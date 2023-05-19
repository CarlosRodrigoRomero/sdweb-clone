import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import { InformeService } from '@data/services/informe.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';

import { PlantaInterface } from '@core/models/planta';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-portfolio-recalc',
  templateUrl: './portfolio-recalc.component.html',
  styleUrls: ['./portfolio-recalc.component.css'],
})
export class PortfolioRecalcComponent implements OnInit {
  private plantas: PlantaInterface[];

  constructor(
    private informeService: InformeService,
    private anomaliaService: AnomaliaService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {}

  calculateFixableMAE() {
    this.plantaService
      .getAllPlantas()
      .pipe(
        take(1),
        switchMap((plantas) => {
          this.plantas = plantas;

          return this.informeService.getInformes();
        }),
        take(1)
      )
      .subscribe(async (informes) => {
        for (let index = 0; index < informes.length; index++) {
          if (index < 10) {
            let informe = informes[index];
            const planta = this.plantas.find((pl) => pl.id === informe.plantaId);
            this.anomaliaService.planta = planta;
            if (planta.tipo === 'seguidores') {
              await this.anomaliaService
                .getAnomalias$(informe.id, 'pcs')
                .pipe(take(1))
                .toPromise()
                .then((anomalias) => {
                  const fixableAnoms = anomalias.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));
                  console.log('seguidores');
                  console.log(informe.mae);
                  console.log(this.reportControlService.getMae(fixableAnoms, informe.numeroModulos));
                  // this.reportControlService.setMae(fixableAnoms, informe, 'fixablePower');
                });
            } else {
              await this.anomaliaService
                .getAnomalias$(informe.id, 'anomalias')
                .pipe(take(1))
                .toPromise()
                .then((anomalias) => {
                  const fixableAnoms = anomalias.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));
                  console.log('fija');
                  console.log(informe.mae);
                  console.log(this.reportControlService.getMae(fixableAnoms, informe.numeroModulos));
                  // this.reportControlService.setMae(fixableAnoms, informe, 'fixablePower');
                });
            }
          }
        }
      });
  }
}
