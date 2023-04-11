import { Component, OnInit } from '@angular/core';

import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-total-loss-container',
  templateUrl: './total-loss-container.component.html',
  styleUrls: ['./total-loss-container.component.css'],
})
export class TotalLossContainerComponent implements OnInit {
  totalLossPercentage: number;
  totalLoss: number;
  totalFixedLossPercentage: number;
  totalFixedLoss: number;
  totalNotFixedLossPercentage: number;
  totalNotFixedLoss: number;

  constructor(private filterService: FilterService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.filterService.filteredElements$.subscribe((elems) => {
      const selectedReport = this.reportControlService.informes.find(
        (informe) => informe.id === this.reportControlService.selectedInformeId
      );

      let anomalias: Anomalia[] = [];
      if (this.reportControlService.plantaFija) {
        anomalias = elems as Anomalia[];
      } else {
        anomalias = (elems as Seguidor[]).map((seguidor) => seguidor.anomaliasCliente).flat();
      }

      this.totalLossPercentage = this.reportControlService.getLossReport(anomalias, selectedReport);
      this.totalLoss = this.totalLossPercentage * this.reportControlService.planta.potencia;
      this.totalFixedLossPercentage = this.reportControlService.getFixedLossReport(anomalias, selectedReport);
      this.totalFixedLoss = this.totalFixedLossPercentage * this.reportControlService.planta.potencia;
      this.totalNotFixedLossPercentage = this.totalLossPercentage - this.totalFixedLossPercentage;
      this.totalNotFixedLoss = this.totalNotFixedLossPercentage * this.reportControlService.planta.potencia;
    });
  }
}
