import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';

import { GLOBAL } from '@data/constants/global';
import { FilterService } from '@data/services/filter.service';
import { Anomalia } from '@core/models/anomalia';
import { PlantSummaryComponent } from '@shared/components/plant-summary/plant-summary.component';
import { InformeInterface } from '@core/models/informe';
import { Seguidor } from '@core/models/seguidor';

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
  private selectedInformeId: string;
  private selectedReport: InformeInterface;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInformeId = informeId;
        this.selectedReport = this.reportControlService.informes.find((informe) => informe.id === informeId);

        const anomaliasInforme = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informeId);
        this.numTotalAnoms = anomaliasInforme.length;
        const fixableAnoms = anomaliasInforme.filter((anomalia) => GLOBAL.fixableTypes.includes(anomalia.tipo));
        this.numFixableAnoms = fixableAnoms.length;

        this.totalMae = this.reportControlService.getMae(anomaliasInforme, this.selectedReport.numeroModulos);
        this.fixableMae = this.reportControlService.getMae(fixableAnoms, this.selectedReport.numeroModulos);

        this.filterService.filteredElements$.subscribe((elems) => {
          const elemsInforme = elems.filter((elem) => elem.informeId === this.selectedInformeId);

          if (this.reportControlService.plantaFija) {
            this.numTotalAnoms = elemsInforme.length;
            this.numFixableAnoms = elemsInforme.filter((anomalia) => GLOBAL.fixableTypes.includes(anomalia.tipo)).length;

            //Obtener Mae de anomalías filtradas para fijas
            this.totalMae = this.reportControlService.getMaeInformeFija(
              elemsInforme as Anomalia[],
              this.selectedReport
            );

            //Obtener Mae Reparable de anomalías filtradas para fijas
            this.fixableMae = this.reportControlService.getFixedLossReport(
              elemsInforme as Anomalia[],
              this.selectedReport
            );
          } else {
            this.numTotalAnoms = elemsInforme.reduce(
              (acc, elem) => acc + (elem as Seguidor).anomaliasCliente.length,
              0
            );
            
            var anomalias = [];
            for (var elem of elemsInforme) {
              anomalias.push(...(elem as Seguidor).anomaliasCliente);
            }

            this.numFixableAnoms = anomalias.filter((anomalia) => GLOBAL.fixableTypes.includes(anomalia.tipo)).length;

            //Obtener Mae de anomalías filtradas para seguidores
            this.totalMae = this.reportControlService.getMaeInformeFija(anomalias, this.selectedReport);

            //Obtener Mae Reparable de anomalías filtradas para seguidres
            this.fixableMae = this.reportControlService.getFixedLossReport(anomalias, this.selectedReport);
          }

          // detectamos cambios porque estamos utilizando la estrategia OnPush
          this.cdr.detectChanges();
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
