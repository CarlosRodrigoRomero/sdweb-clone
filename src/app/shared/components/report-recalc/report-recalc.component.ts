import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PcService } from '@data/services/pc.service';

import { InformeInterface } from '@core/models/informe';
import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-report-recalc',
  templateUrl: './report-recalc.component.html',
  styleUrls: ['./report-recalc.component.css'],
})
export class ReportRecalcComponent implements OnInit, OnDestroy {
  private selectedInforme: InformeInterface;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private http: HttpClient,
    private anomaliaService: AnomaliaService,
    private pcService: PcService
  ) {}

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
        (anom) => anom.informeId === this.selectedInforme.id
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

  setTipoNextYear() {
    this.http.get('assets/tiposNextYear.json').subscribe((data: any[]) => {
      const anomaliasSelectedInforme = this.reportControlService.allAnomalias.filter(
        (anom) => anom.informeId === this.reportControlService.selectedInformeId
      );

      anomaliasSelectedInforme.forEach((anom, index) => {
        // if (index < 20) {
        const object = data.find((item) => item.id === anom.id);

        if (object) {
          if (this.reportControlService.plantaFija) {
            // this.anomaliaService.updateAnomaliaField(anom.id, 'tipoNextYear', object.tipo2);
          } else {
            // this.pcService.updatePcField(anom.id, 'tipoNextYear', object.tipo2);
          }
        }
        // }
      });
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
