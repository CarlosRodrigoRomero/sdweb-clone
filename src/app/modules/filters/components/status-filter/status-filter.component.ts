import { Component, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { StatusFilter } from '@core/models/statusFilter';
import { Seguidor } from '@core/models/seguidor';

import { GLOBAL } from '@data/constants/global';


interface Status {
  status: number;
  label?: string;
  completed?: boolean;
  nAnomalias?: number;
  nAllAnomalias?: number;
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
    private translate: TranslateService,
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

    this.subscriptions.add(
      this.translate.stream('Estado').subscribe((res: string) => {
        this.defaultSelectLabel = res;
      })
    );

    // Nos suscribimos a los elementos filtrables para obtener el número de anomalias de cada status
    this.subscriptions.add(
      this.filterService.allFiltrableElements$.subscribe((anomalias) => {
        this.statusElems.forEach((statusElem) => {
          // Primero filtramos para obtener un array de anomalías o seguidores con el status correspondiente
          let filtered = anomalias.filter((x) => {
            if (x.hasOwnProperty('anomaliasCliente')){
              return (x as Seguidor).anomaliasCliente.filter((anom) => anom.status === GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(statusElem.label)]).length > 0
            } else {
              return x.status === GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(statusElem.label)]
            }
          });
          // Después sumamos todas las anomalías
          statusElem.nAllAnomalias = filtered.reduce((acc, elem) => {
            if (elem.hasOwnProperty('anomaliasCliente')){
              return acc + (elem as Seguidor).anomaliasCliente.length
            } else {
              return acc + 1
            }
          }, 0);
        });
        // Mostramos solo los status presentes en alguna anomalía
        this.statusElems = this.statusElems.filter(elem => elem.nAllAnomalias > 0);
      })
    );

  // Nos suscribimos a los elementos filtrados para obtener el número de anomalías de cada status
    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((filElem) => {
        this.statusElems.forEach((statusElem) => {
          let filtered = filElem.filter((x) => {
            if (x.hasOwnProperty('anomaliasCliente')) {
              return (x as Seguidor).anomaliasCliente.filter((anom) => anom.status === GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(statusElem.label)]).length > 0;
            } else {
              return x.status == GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(statusElem.label)];
            }
          })
          statusElem.nAnomalias = filtered.reduce((acc, elem) => {
            if (elem.hasOwnProperty('anomaliasCliente')){
              return acc + (elem as Seguidor).anomaliasCliente.length
            } else {
              return acc + 1
            }
          }, 0);
        });
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
