import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ReportControlService } from '@core/services/report-control.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-warnings-menu',
  templateUrl: './warnings-menu.component.html',
  styleUrls: ['./warnings-menu.component.css'],
})
export class WarningsMenuComponent implements OnInit {
  warnings: string[] = [];
  private allAnomalias: Anomalia[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.reportControlService.allFilterableElements$
      .pipe(
        switchMap((elems) => {
          if (this.reportControlService.plantaFija) {
            this.allAnomalias = elems as Anomalia[];
          } else {
            (elems as Seguidor[]).forEach((seg) => this.allAnomalias.push(...seg.anomaliasCliente));
          }

          return this.reportControlService.selectedInformeId$;
        })
      )
      .subscribe((informeId) => {
        const selectedInforme = this.reportControlService.informes.find((informe) => informe.id === informeId);

        const anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);

        if (selectedInforme !== undefined && anomaliasInforme.length > 0) {
          this.checkTiposAnoms(anomaliasInforme, selectedInforme);
        }
      });
  }

  private checkTiposAnoms(anomalias: Anomalia[], informe: InformeInterface) {
    console.log(informe.tiposAnomalias);
    if (informe !== undefined && anomalias.length > 0) {
      const sumTiposAnoms = informe.tiposAnomalias.reduce((acum, curr, index) => {
        // las celulas calientes son un array por separado
        if (index === 8 || index === 9) {
          return acum + curr.reduce((a, c) => a + c);
        } else {
          return acum + curr;
        }
      });

      if (anomalias.length !== sumTiposAnoms) {
        this.warnings.push('El nº de anomalías no coincide con la suma de los tipos de anomalías');
      }
    }
  }
}
