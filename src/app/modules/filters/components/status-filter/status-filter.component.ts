import { Component, OnDestroy, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { PlantaService } from '@data/services/planta.service';

import { StatusFilter } from '@core/models/statusFilter';

import { GLOBAL } from '@data/constants/global';

interface Status {
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
  labels = {'Pendiente de reparar': 'pendiente', 'Revisada': 'revisada', 'Reparada': 'reparada'}

  defaultLabelStatus = true;
  defaultSelectLabel = 'Status';
  selectedLabels: string[] = [this.defaultSelectLabel];

  selectedInformeId: string;
  anomalias: any[];

  // statusSelected: boolean[];
  selection = new SelectionModel<Status>(true, []);

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService, 
    private filterControlService: FilterControlService,
    private anomaliaService: AnomaliaService,
    private reportControlService: ReportControlService,
    private anomaliasControlService: AnomaliasControlService,
    private plantaService: PlantaService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    GLOBAL.labels_status.forEach((label) =>
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
          elem.nAnomalias = filElem.filter((x) => x.status === GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(elem.label)]).length;
        });
      })
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.subscriptions.add(
      this.plantaService
        .getPlanta(this.reportControlService.plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            return this.anomaliaService.getAnomaliasPlanta$(planta, this.reportControlService.informes);
          })
        )
        .subscribe((anomalias) => {
          // filtramos las anomalias que ya no consideramos anomalias
          this.anomalias = this.anomaliaService.getRealAnomalias(anomalias);
          // Claculamos el número de anomalias de cada status antes de filtrar
          this.statusElems.forEach((elem) => {
            elem.nAllAnomalias = this.anomalias.filter((x) => x.status === GLOBAL.tipos_status[GLOBAL.labels_status.indexOf(elem.label)]).length;
          });
        })  
    );
    
  }

  onChangeFiltroStatus(event: MatCheckboxChange) {
    console.log(this.anomalias);
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
