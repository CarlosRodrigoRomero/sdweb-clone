import { Component, OnDestroy, OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { FilterService } from '@data/services/filter.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';

import { TipoElemFilter } from '@core/models/tipoPcFilter';
import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

export interface LabelTipo {
  tipo: number;
  label?: string;
  count?: number;
  completed?: boolean;
  color?: string;
}

@Component({
  selector: 'app-tipo-filter',
  templateUrl: './tipo-filter.component.html',
  styleUrls: ['./tipo-filter.component.css'],
})
export class TipoFilterComponent implements OnInit, OnDestroy {
  tiposElem: LabelTipo[] = [];
  filtroTipo: TipoElemFilter;
  filterTipoCounts: number[] = [];

  defaultLabelStatus = true;
  defaultSelectLabel = 'Tipo de anomalía';
  selectedLabels: string[] = [this.defaultSelectLabel];

  tiposSelected: boolean[];
  selection = new SelectionModel<LabelTipo>(true, []);

  public plantaId: string;
  private planta: PlantaInterface;
  public informesIdList: string[];
  public allAnomalias: Anomalia[];

  public labelsCategoria: string[];
  public coloresCategoria: string[];
  public numsCategoria: number[];

  selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private anomaliaService: AnomaliaService,
    private filterControlService: FilterControlService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.plantaId = this.reportControlService.plantaId;
    this.informesIdList = this.reportControlService.informesIdList;
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.subscriptions.add(
      this.plantaService
        .getPlanta(this.plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            this.planta = planta;

            return this.anomaliaService.getAnomaliasPlanta$(this.planta, this.reportControlService.informes);
          })
        )
        .subscribe((anomalias) => {
          // filtramos las anomalias que ya no consideramos anomalias
          this.allAnomalias = this.anomaliaService.getRealAnomalias(anomalias);

          this.tiposElem = [];
          // obtenermos los labels de todas las anomalias
          this._getAllCategorias(this.allAnomalias);
          this.labelsCategoria.forEach((label, i) => {
            this.tiposElem.push({ tipo: GLOBAL.labels_tipos.indexOf(label), label, color: this.coloresCategoria[i] });

            this.tiposSelected.push(false);
          });

          this.numsCategoria.forEach((num) => {
            this.filterTipoCounts.push(
              this.allAnomalias
                .filter((elem) => elem.informeId === this.selectedInformeId)
                // tslint:disable-next-line: triple-equals
                .filter((elem) => elem.tipo == num).length
            );
          });
        })
    );

    // nos suscribimos a los tipos seleccionados de filter control
    this.subscriptions.add(
      this.filterControlService.tiposSelected$.subscribe((tiposSel) => (this.tiposSelected = tiposSel))
    );

    // nos suscribimos a los labels del filter control
    this.subscriptions.add(
      this.filterControlService.selectedTipoLabels$.subscribe((labels) => (this.selectedLabels = labels))
    );

    // nos suscribimos al estado en el control de filtros
    this.subscriptions.add(
      this.filterControlService.labelTipoDefaultStatus$.subscribe((value) => (this.defaultLabelStatus = value))
    );

    this.subscriptions.add(
      this.translate.stream('Tipo de anomalia').subscribe((res: string) => {
        this.defaultSelectLabel = res;
      })
    );
  }

  onChangeFiltroTipo(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroTipo = new TipoElemFilter(
        event.source.id,
        'tipo',
        GLOBAL.labels_tipos.indexOf(event.source.name),
        this.tiposElem.length,
        Number(event.source.value)
      );
      this.filterService.addFilter(this.filtroTipo);

      this.filterControlService.tiposSelected[Number(event.source.id.replace('tipo_', ''))] = true;

      // añadimos el tipo seleccionado a la variable
      if (this.selectedLabels[0] !== this.defaultSelectLabel) {
        this.filterControlService.selectedTipoLabels.push(event.source.name);
      } else {
        this.filterControlService.labelTipoDefaultStatus = false;
        this.filterControlService.selectedTipoLabels = [event.source.name];
      }
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'tipo')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );

      this.filterControlService.tiposSelected[Number(event.source.id.replace('tipo_', ''))] = false;

      // eliminamos el 'tipo' de seleccionados
      this.selectedLabels = this.selectedLabels.filter((sel) => sel !== event.source.name);
      // si era el último ponemos el label por defecto
      if (this.selectedLabels.length === 0) {
        this.filterControlService.labelTipoDefaultStatus = true;
        this.selectedLabels.push(this.defaultSelectLabel);
      }
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  private _getAllCategorias(anomalias): void {
    const allNumCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);

    const labelsCategoria = Array<string>();
    const coloresCategoria = Array<string>();
    const numsCategoria = Array<number>();

    allNumCategorias.forEach((i) => {
      if (anomalias.filter((anom) => anom.tipo === i).length > 0) {
        labelsCategoria.push(GLOBAL.labels_tipos[i]);
        coloresCategoria.push(COLOR.colores_tipos[i]);
        numsCategoria.push(i);
      }
    });

    this.labelsCategoria = labelsCategoria;
    this.coloresCategoria = coloresCategoria;
    this.numsCategoria = numsCategoria;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
