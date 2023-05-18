import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-total-loss-container',
  templateUrl: './total-loss-container.component.html',
  styleUrls: ['./total-loss-container.component.css'],
})
export class TotalLossContainerComponent implements OnInit, OnDestroy {
  totalMae: number;
  fixableMae: number;
  numTotalAnoms: number;
  numFixableAnoms: number;

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        const selectedReport = this.reportControlService.informes.find((informe) => informe.id === informeId);

        const anomaliasInforme = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informeId);
        this.numTotalAnoms = anomaliasInforme.length;
        const fixableAnoms = anomaliasInforme.filter((anomalia) => GLOBAL.fixableTypes.includes(anomalia.tipo));
        this.numFixableAnoms = fixableAnoms.length;

        this.totalMae = this.reportControlService.getMae(anomaliasInforme, selectedReport.numeroModulos);
        this.fixableMae = this.reportControlService.getMae(fixableAnoms, selectedReport.numeroModulos);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
