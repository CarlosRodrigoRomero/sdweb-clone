import { Component, OnInit } from '@angular/core';
import { NavigationStart, Router, Event } from '@angular/router';

import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { InformeService } from '@core/services/informe.service';
import { ReportControlService } from '@core/services/report-control.service';
import { PlantaService } from '@core/services/planta.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-plant-summary',
  templateUrl: './plant-summary.component.html',
  styleUrls: ['./plant-summary.component.css'],
})
export class PlantSummaryComponent implements OnInit {
  nombrePlanta = 'Planta demo';
  potenciaPlanta = 1;
  tipoPlanta = 'fija';
  public planta: PlantaInterface = undefined;
  public informe: InformeInterface = null;
  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private informeService: InformeService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    // si cargamos vista informe directamente, nos subscribimos al informe seleccionado
    if (this.router.url.includes('fixed') || this.router.url.includes('tracker')) {
      this.subscription.add(
        this.reportControlService.selectedInformeId$
          .pipe(
            switchMap((informeId) => this.informeService.getInforme(informeId)),
            switchMap((informe) => {
              this.informe = informe;

              return this.plantaService.getPlanta(this.informe.plantaId);
            })
          )
          .subscribe((planta) => {
            this.planta = planta;

            this.nombrePlanta = this.planta.nombre;
            this.potenciaPlanta = this.planta.potencia;
            this.tipoPlanta = this.planta.tipo;
          })
      );
    }

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        if (event.url.includes('fixed') || event.url.includes('tracker')) {
          // si navegamos a vista informe nos suscribimos al informe seleccionado
          this.subscription.add(
            this.reportControlService.selectedInformeId$
              .pipe(switchMap((informeId) => this.informeService.getInforme(informeId)))
              .subscribe((informe) => {
                this.informe = informe;
              })
          );
        } else {
          // sino cancelamos la suscripcion
          this.subscription.unsubscribe();
          this.informe = undefined;
        }
      }
    });
  }
}
