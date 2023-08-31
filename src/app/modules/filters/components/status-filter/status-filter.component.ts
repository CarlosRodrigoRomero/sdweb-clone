import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { ReportControlService } from '@data/services/report-control.service';

import { StatusFilter } from '@core/models/statusFilter';
import { Seguidor } from '@core/models/seguidor';

import { GLOBAL } from '@data/constants/global';


interface Status {
  status: number;
  label?: string;
  completed?: boolean;
  nAnomalias?: number;
  nAllAnomalias?: number;
  disabled?: boolean;
}
@Component({
  selector: 'app-status-filter',
  templateUrl: './status-filter.component.html',
  styleUrls: ['./status-filter.component.css']
})
export class StatusFilterComponent implements OnInit {

  statusElems: Status[] = [];
  allComplete: boolean;
  filtroStatus: StatusFilter;
  public statusSelected: boolean[] = [false, false, false];

  defaultLabelStatus = true;
  defaultSelectLabel = 'Estado';
  selectedLabels: string[] = [this.defaultSelectLabel];

  selectedInformeId: string;
  anomalias: any[];

  selection = new SelectionModel<Status>(true, []);

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService, 
    private filterControlService: FilterControlService,
    private reportControlService: ReportControlService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    GLOBAL.labels_status.forEach((label, i) =>
      this.statusElems.push({
        status: i,
        label,
        completed: false,
      })
    );
   // nos suscribimos a los status seleccionados de filter control
    this.subscriptions.add(
      this.filterControlService.statusSelected$.subscribe((statusSel) => (this.statusSelected = statusSel))
    );

    // nos suscribimos a los labels del filter control
    this.subscriptions.add(
      this.filterControlService.selectedStatusLabels$.subscribe((labels) => (this.selectedLabels = labels))
    );

    // nos suscribimos al estado en el control de filtros
    this.subscriptions.add(
      this.filterControlService.labelStatusDefaultStatus$.subscribe((value) => (this.defaultLabelStatus = value))
    );

    // Nos suscribimos al informe seleccionado y a los elementos filtrados para poder mostrar el número de anomalía por status
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$
        .pipe(
          switchMap((informeId) => {
            this.selectedInformeId = informeId;
            this.statusElems.forEach((statusElem) => {
              statusElem.nAllAnomalias = this.reportControlService.allAnomalias.filter(
                (anom) => anom.informeId === this.selectedInformeId && 
                          anom.status == GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(statusElem.label)]
              ).length;
              // Mostramos solo los status presentes en alguna anomalía
              statusElem.disabled = statusElem.nAllAnomalias === 0;
            });
            return this.filterService.filteredElements$;
          })
        )
        .subscribe((elems) => {
          const elemsInforme = elems.filter((elem) => elem.informeId === this.selectedInformeId);
          this.statusElems.forEach((statusElem) => {
            if (this.reportControlService.plantaNoS2E) {
              statusElem.nAnomalias = elemsInforme.filter(
                (anom) => anom.status == GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(statusElem.label)]
              ).length;
            } else {
              statusElem.nAnomalias = elemsInforme.reduce((acc, elem) => {
                return acc + (elem as Seguidor).anomaliasCliente.filter((anom) => 
                  anom.status === GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(statusElem.label)]
                ).length
              }, 0);
            };
          });

          // detectamos cambios porque estamos utilizando la estrategia OnPush
          this.cdr.detectChanges();
        })
    );
  }

  onChangeFiltroStatus(event: MatCheckboxChange) {
    const indexSelected = Number(event.source.id.replace('status_', '')) - 1;
    if (event.checked) {
      this.filtroStatus = new StatusFilter(
        event.source.id,
        'status',
        event.source.name,
        indexSelected
      );
      this.filterService.addFilter(this.filtroStatus);
      this.filterControlService.statusSelected[indexSelected] = true;
      // añadimos el modelo seleccionado a la variable
      if (this.selectedLabels[0] !== this.defaultSelectLabel) {
        this.filterControlService.selectedStatusLabels.push(event.source.name);
      } else {
        this.filterControlService.labelStatusDefaultStatus = false;
        this.filterControlService.selectedStatusLabels = [event.source.name];
      }
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'status')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );

      this.filterControlService.statusSelected[indexSelected] = false;
      // eliminamos el 'status' de seleccionados
      this.selectedLabels = this.selectedLabels.filter((sel) => sel !== event.source.name);
      // si era el último ponemos el label por defecto
      if (this.selectedLabels.length === 0) {
        this.filterControlService.labelStatusDefaultStatus = true;
        this.selectedLabels.push(this.defaultSelectLabel);
      }
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
