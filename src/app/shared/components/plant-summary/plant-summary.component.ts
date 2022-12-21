import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationStart, Router, Event } from '@angular/router';

import { switchMap } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';

import { InformeService } from '@data/services/informe.service';
import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { MathOperations } from '@core/classes/math-operations';
import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-plant-summary',
  templateUrl: './plant-summary.component.html',
  styleUrls: ['./plant-summary.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PlantSummaryComponent implements OnInit, OnDestroy {
  nombrePlanta = 'Planta';
  potenciaPlanta = 1;
  tipoPlanta = 'fija';
  fechaSelectedInforme;
  vientoVelocidad: number;
  public planta: PlantaInterface = undefined;
  public _informe: InformeInterface = undefined;
  public informe$ = new BehaviorSubject<InformeInterface>(this._informe);
  private selectedInformeId: string;
  numAnoms = 0;
  numAnomsFiltered = 0;

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private informeService: InformeService,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.planta = this.reportControlService.planta;

    this.nombrePlanta = this.planta.nombre;
    this.potenciaPlanta = this.planta.potencia;
    this.tipoPlanta = this.planta.tipo;

    // si cargamos vista informe directamente, nos subscribimos al informe seleccionado
    if (this.router.url.includes('fixed') || this.router.url.includes('tracker')) {
      this.subscription.add(
        this.reportControlService.selectedInformeId$
          .pipe(
            switchMap((informeId) => {
              this.selectedInformeId = informeId;

              this.informe = this.reportControlService.informes.find(
                (informe) => informe.id === this.selectedInformeId
              );

              this.fechaSelectedInforme = this.informeService.getDateLabelInforme(this.informe);

              if (this.informe.vientoVelocidad !== undefined) {
                this.vientoVelocidad = MathOperations.kmhToBeaufort(this.informe.vientoVelocidad);
              }

              this.numAnoms = this.reportControlService.allAnomalias.filter(
                (anom) => anom.informeId === this.selectedInformeId
              ).length;

              return this.filterService.filteredElements$;
            })
          )
          .subscribe((elems) => {
            const elemsInforme = elems.filter((elem) => elem.informeId === this.selectedInformeId);

            if (this.reportControlService.plantaFija) {
              this.numAnomsFiltered = elemsInforme.length;
            } else {
              this.numAnomsFiltered = elemsInforme.reduce(
                (acc, elem) => acc + (elem as Seguidor).anomaliasCliente.length,
                0
              );
            }

            // detectamos cambios porque estamos utilizando la estrategia OnPush
            this.cdr.detectChanges();
          })
      );
    }

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        if (event.url.includes('fixed') || event.url.includes('tracker')) {
          // si navegamos a vista informe nos suscribimos al informe seleccionado
          this.subscription.add(
            this.reportControlService.selectedInformeId$.subscribe((informeId) => {
              this.selectedInformeId = informeId;

              this.informe = this.reportControlService.informes.find(
                (informe) => informe.id === this.selectedInformeId
              );

              this.planta = this.reportControlService.planta;

              this.nombrePlanta = this.planta.nombre;
              this.potenciaPlanta = this.planta.potencia;
              this.tipoPlanta = this.planta.tipo;
            })
          );
        } else {
          // sino cancelamos la suscripcion
          this.subscription.unsubscribe();
          this.informe = undefined;
          this.planta = undefined;
        }
      }
    });
  }

  get informe() {
    return this._informe;
  }

  set informe(value: InformeInterface) {
    this._informe = value;
    this.informe$.next(value);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
