import { Component, OnDestroy, OnInit } from '@angular/core';

import { InformeInterface } from '@core/models/informe';
import { Seguidor } from '@core/models/seguidor';

import { ReportControlService } from '@data/services/report-control.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-report-recalc',
  templateUrl: './report-recalc.component.html',
  styleUrls: ['./report-recalc.component.css'],
})
export class ReportRecalcComponent implements OnInit, OnDestroy {
  private selectedInforme: InformeInterface;

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInforme = this.reportControlService.informes.find((informe) => informe.id === informeId);
      })
    );
  }

  recalMAEyCC() {
    if (this.reportControlService.plantaFija) {
      const anomaliasInforme = this.reportControlService.allAnomalias.filter(
        (anom) => anom.informeId === this.selectedInforme
      );
      this.reportControlService.setMaeInformeFija(anomaliasInforme, this.selectedInforme);
      this.reportControlService.setCCInformeFija(anomaliasInforme, this.selectedInforme);
    } else {
      const allSeguidores = this.reportControlService.allFilterableElements as Seguidor[];
      const seguidoresInforme = allSeguidores.filter((seg) => seg.informeId === this.selectedInforme.id);

      this.reportControlService.setMaeInformeSeguidores(seguidoresInforme, this.selectedInforme);
      this.reportControlService.setCCInformeSeguidores(seguidoresInforme, this.selectedInforme);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
