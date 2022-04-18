import { Component, OnDestroy, OnInit } from '@angular/core';

import { switchMap } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';

interface Warning {
  type: string;
  content: string;
}

@Component({
  selector: 'app-warnings-menu',
  templateUrl: './warnings-menu.component.html',
  styleUrls: ['./warnings-menu.component.css'],
})
export class WarningsMenuComponent implements OnInit, OnDestroy {
  warnings: Warning[] = [];
  private allAnomalias: Anomalia[] = [];
  private selectedInforme: InformeInterface;
  private anomaliasInforme: Anomalia[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService, private informeService: InformeService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.allFilterableElements$
        .pipe(
          switchMap((elems) => {
            if (this.reportControlService.plantaFija) {
              this.allAnomalias = elems as Anomalia[];
            } else {
              (elems as Seguidor[]).forEach((seg) => this.allAnomalias.push(...seg.anomaliasCliente));
            }

            return combineLatest([
              this.informeService.getInformesDePlanta(this.reportControlService.plantaId),
              this.reportControlService.selectedInformeId$,
            ]);
          })
        )
        .subscribe(([informes, informeId]) => {
          this.selectedInforme = informes.find((informe) => informe.id === informeId);

          this.anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);

          if (this.selectedInforme !== undefined && this.anomaliasInforme.length > 0) {
            // reseteamos warnings con cada actualización
            this.warnings = [];
            // this.warnings = [{ content: 'hola', type: 'tipo' }];

            this.checkTiposAnoms(this.anomaliasInforme, this.selectedInforme);
            this.checkNumsCoA(this.anomaliasInforme, this.selectedInforme);
            this.checkNumsCriticidad(this.anomaliasInforme, this.selectedInforme);
          }
        })
    );
  }

  fixProblem(type: string) {
    switch (type) {
      case 'tiposAnom':
        this.reportControlService.setTiposAnomInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
      case 'numsCoA':
        this.reportControlService.setNumAnomsCoAInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
      case 'numsCriticidad':
        this.reportControlService.setNumAnomsCritInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
    }
  }

  private checkTiposAnoms(anomalias: Anomalia[], informe: InformeInterface) {
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
        this.warnings.push({
          content: 'El nº de anomalías no coincide con la suma de los tipos de anomalías',
          type: 'tiposAnom',
        });
      }
    }
  }

  private checkNumsCoA(anomalias: Anomalia[], informe: InformeInterface) {
    if (informe !== undefined && anomalias.length > 0) {
      const sumNumsCoA = informe.numsCoA.reduce((acum, curr) => acum + curr);

      if (anomalias.length !== sumNumsCoA) {
        this.warnings.push({ content: 'El nº de anomalías no coincide con la suma de los CoA', type: 'numsCoA' });
      }
    }
  }

  private checkNumsCriticidad(anomalias: Anomalia[], informe: InformeInterface) {
    if (informe !== undefined && anomalias.length > 0) {
      const sumNumsCriticidad = informe.numsCriticidad.reduce((acum, curr) => acum + curr);

      if (anomalias.length !== sumNumsCriticidad) {
        this.warnings.push({
          content: 'El nº de anomalías no coincide con la suma de las anomalías por criticidad',
          type: 'numsCriticidad',
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
