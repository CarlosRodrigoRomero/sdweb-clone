import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, Event, NavigationStart } from '@angular/router';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';

import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
@Component({
  selector: 'app-report-principal-data-container',
  templateUrl: './report-principal-data-container.component.html',
  styleUrls: ['./report-principal-data-container.component.css'],
})
export class ReportPrincipalDataContainerComponent implements OnInit, OnDestroy {
  numAnoms = 0;
  numAnomsFiltered = 0;
  mae: number;
  maeReparable: number;
  informeSelected: InformeInterface;

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private reportControlService: ReportControlService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    // si cargamos vista informe directamente, nos subscribimos al informe seleccionado
    if (
      this.router.url.includes('fixed') ||
      this.router.url.includes('tracker') ||
      this.router.url.includes('rooftop')
    ) {
      this.subscription.add(
        this.reportControlService.selectedInformeId$
          .pipe(
            switchMap((informeId) => {
              this.informeSelected = this.reportControlService.informes.find((informe) => informe.id === informeId);

              this.numAnoms = this.reportControlService.allAnomalias.filter(
                (anom) => anom.informeId === informeId
              ).length;

              return this.filterService.filteredElements$;
            })
          )
          .subscribe((elems) => {
            const elemsInforme = elems.filter((elem) => elem.informeId === this.informeSelected.id);

            if (this.reportControlService.plantaFija) {
              this.numAnomsFiltered = elemsInforme.length;

              //Obtener Mae de anomalías filtradas para fijas
              this.mae = this.reportControlService.getMaeInformeFija(elemsInforme as Anomalia[], this.informeSelected);

              //Obtener Mae Reparable de anomalías filtradas para fijas
              this.maeReparable = this.reportControlService.getFixedLossReport(
                elemsInforme as Anomalia[],
                this.informeSelected
              );
            } else {
              this.numAnomsFiltered = elemsInforme.reduce(
                (acc, elem) => acc + (elem as Seguidor).anomaliasCliente.length,
                0
              );
              var anomalias = [];
              for (var elem of elemsInforme) {
                anomalias.push(...(elem as Seguidor).anomaliasCliente);
              }

              //Obtener Mae de anomalías filtradas para seguidores
              this.mae = this.reportControlService.getMaeInformeFija(anomalias, this.informeSelected);

              //Obtener Mae Reparable de anomalías filtradas para seguidres
              this.maeReparable = this.reportControlService.getFixedLossReport(anomalias, this.informeSelected);
            }

            // detectamos cambios porque estamos utilizando la estrategia OnPush
            // this.cdr.detectChanges();
          })
      );
    }

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        if (event.url.includes('fixed') || event.url.includes('tracker') || event.url.includes('rooftop')) {
          // si navegamos a vista informe nos suscribimos al informe seleccionado
          this.subscription.add(
            this.reportControlService.selectedInformeId$.subscribe((informeId) => {
              this.informeSelected = this.reportControlService.informes.find((informe) => informe.id === informeId);
            })
          );
        } else {
          this.informeSelected = undefined;

          // sino cancelamos la suscripcion
          this.subscription.unsubscribe();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
