import { Component, OnInit } from '@angular/core';

import { ReportControlService } from '@data/services/report-control.service';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-total-loss-container',
  templateUrl: './total-loss-container.component.html',
  styleUrls: ['./total-loss-container.component.css'],
})
export class TotalLossContainerComponent implements OnInit {
  totalMae: number;
  fixableMae: number;
  numTotalAnoms: number;
  numFixableAnoms: number;

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    const anomalias = this.reportControlService.allAnomalias;
    this.numTotalAnoms = anomalias.length;
    const fixableAnoms = anomalias.filter((anomalia) => GLOBAL.fixableTypes.includes(anomalia.tipo));
    this.numFixableAnoms = fixableAnoms.length;

    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      const selectedReport = this.reportControlService.informes.find((informe) => informe.id === informeId);

      this.totalMae = this.reportControlService.getMae(anomalias, selectedReport.numeroModulos);
      this.fixableMae = this.reportControlService.getMae(fixableAnoms, selectedReport.numeroModulos);
    });
  }
}
