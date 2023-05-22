import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import { InformeService } from '@data/services/informe.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';
import { SeguidorService } from '@data/services/seguidor.service';

import { PlantaInterface } from '@core/models/planta';

import { GLOBAL } from '@data/constants/global';
import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';
import { ZonesService } from '@data/services/zones.service';
import { InformeInterface } from '@core/models/informe';

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
    private plantaService: PlantaService,
    private seguidorService: SeguidorService,
    private zonesService: ZonesService
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
        for (let index = 0; index < this.plantas.length; index++) {
          const planta = this.plantas[index];
          this.anomaliaService.planta = planta;

          await this.plantaService
            .getLocationsArea(planta.id)
            .pipe(take(1))
            .toPromise()
            .then(async (locAreas) => {
              this.zonesService.locAreas = locAreas;
              this.zonesService.zones = this.zonesService.getZones(planta, locAreas);

              const informesPlanta = informes.filter((inf) => inf.plantaId === this.plantas[index].id);
              for (let i = 0; i < informesPlanta.length; i++) {
                let informe = informesPlanta[i];

                if (planta.tipo !== 'seguidores') {
                  // obtenemos todas las anomalías
                  await this.anomaliaService
                    .getAnomaliasPlanta$(planta, [informe])
                    .pipe(take(1))
                    .toPromise()
                    .then((anomalias) => {
                      const fixableAnoms = anomalias.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));

                      this.reportControlService.setMae(fixableAnoms, informe, 'fixablePower');
                    });
                } else {
                  // obtenemos todos los seguidores
                  await this.seguidorService
                    .getSeguidoresPlanta$(planta, [informe])
                    .pipe(take(1))
                    .toPromise()
                    .then((segs) => {
                      const seguidores = segs as Seguidor[];

                      informe = this.setNumberOfModules(informe, seguidores.length, planta);

                      const anomalias: Anomalia[] = [];
                      seguidores.forEach((seg) => {
                        if (seg.anomaliasCliente.length > 0) {
                          anomalias.push(...seg.anomaliasCliente);
                        }
                      });
                      const fixableAnoms = anomalias.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));

                      this.reportControlService.setMae(fixableAnoms, informe, 'fixablePower');
                    });
                }
              }
            });
        }
      });
  }

  private setNumberOfModules(informe: InformeInterface, numSegs: number, planta: PlantaInterface) {
    informe.numeroModulos = numSegs * planta.filas * planta.columnas;
    return informe;
  }
}
