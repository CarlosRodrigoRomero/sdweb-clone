import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ReportControlService } from '@core/services/report-control.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-warnings-menu',
  templateUrl: './warnings-menu.component.html',
  styleUrls: ['./warnings-menu.component.css'],
})
export class WarningsMenuComponent implements OnInit {
  warnings = ['Warning 1', 'Warning 2'];
  private allAnomalias: Anomalia[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.reportControlService.allFilterableElements$
      .pipe(
        // take(1),
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

        console.log(anomaliasInforme.length);

        console.log(selectedInforme);
      });
  }
}
