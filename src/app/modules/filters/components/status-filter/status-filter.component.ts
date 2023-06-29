import { Component, OnDestroy, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { StatusFilter } from '@core/models/statusFilter';

interface Status {
  label?: string;
  completed?: boolean;
  nAnomalias?: number;
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
  labels = ['Pendiente', 'Revisada', 'Reparada']

  defaultLabelStatus = true;
  defaultSelectLabel = 'Status';
  selectedLabels: string[] = [this.defaultSelectLabel];

  // statusSelected: boolean[];
  selection = new SelectionModel<Status>(true, []);

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService, 
    private filterControlService: FilterControlService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.labels.forEach((label) =>
      this.statusElems.push({
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

    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((filElem) => {
        this.statusElems.forEach((elem) => {
          elem.nAnomalias = filElem.filter((x) => x.status === elem.label).length;
        });
      })
    );
  }

  onChangeFiltroStatus(event: MatCheckboxChange) {
    const indexSelected = Number(event.source.id) - 1;
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
