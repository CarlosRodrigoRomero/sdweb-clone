import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { take } from 'rxjs/operators';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { MapControlService } from 'src/app/planta-report/services/map-control.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { TipoElemFilter } from '@core/models/tipoPcFilter';
import { Anomalia } from '@core/models/anomalia';

export interface LabelTipo {
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
export class TipoFilterComponent implements OnInit {
  tiposElem: LabelTipo[] = [];
  filtroTipo: TipoElemFilter;
  filterTipoCounts: number[] = [];

  defaultLabelStatus = true;
  defaultSelectLabel = 'Tipo de anomalía';
  selectedLabels: string[] = [this.defaultSelectLabel];

  tiposSelected: boolean[];
  selection = new SelectionModel<LabelTipo>(true, []);

  public plantaId: string;
  public informesList: string[];
  public allAnomalias: Anomalia[];

  public labelsCategoria: string[];
  public coloresCategoria: string[];
  public numsCategoria: number[];

  constructor(
    private filterService: FilterService,
    private route: ActivatedRoute,
    private anomaliaService: AnomaliaService,
    private mapControlService: MapControlService,
    private filterControlService: FilterControlService
  ) {}

  ngOnInit(): void {
    // this.plantaId = this.route.snapshot.paramMap.get('id');
    this.plantaId = 'egF0cbpXnnBnjcrusoeR';
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];
    const informeId = this.informesList[1];

    this.anomaliaService.getAnomaliasPlanta$(this.plantaId).subscribe((anomalias) => {
      this.tiposElem = [];
      // obtenermos los labels de todas las anomalias
      this._getAllCategorias(anomalias);
      this.labelsCategoria.forEach((label, i) => {
        this.tiposElem.push({ label, color: this.coloresCategoria[i] });

        this.tiposSelected.push(false);
      });
      this.numsCategoria.forEach((num) => {
        this.filterTipoCounts.push(
          this.allAnomalias.filter((elem) => elem.informeId === informeId).filter((elem) => elem.tipo === num).length
        );
      });
    });

    // nos suscribimos a los tipos seleccionados de filter control
    this.filterControlService.tiposSelected$.subscribe((tiposSel) => (this.tiposSelected = tiposSel));

    // nos suscribimos para poder checkear desde otros lugares
    /*  this.filterControlService.tiposSelected$.subscribe((sel) =>
      this.tiposElem.forEach((tipoPc, index) => (tipoPc.completed = sel[index]))
    ); */

    // nos suscribimos a los labels del filter control
    this.filterControlService.selectedTipoLabels$.subscribe((labels) => (this.selectedLabels = labels));

    this.mapControlService.selectedInformeId$.subscribe((informeID) => {
      this.filterService.filteredElementsWithoutFilterTipo$.subscribe((elems) => {
        // estas anomalias son las anomalias filtradas
        this.allAnomalias = elems as Anomalia[];
        this.allAnomalias
          .filter((elem) => elem.informeId === informeID)
          .map(() => {
            if (this.numsCategoria !== undefined) {
              this.numsCategoria.forEach((num, i) => {
                this.filterTipoCounts[i] = this.allAnomalias
                  .filter((elem) => elem.informeId === informeID)
                  .filter((elem) => elem.tipo === num).length;
              });
            }
          });
      });
    });

    // nos suscribimos al estado en el control de filtros
    this.filterControlService.labelTipoDefaultStatus$.subscribe((value) => (this.defaultLabelStatus = value));
  }

  onChangeFiltroTipo(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroTipo = new TipoElemFilter(
        event.source.id,
        'tipo',
        GLOBAL.labels_tipos.indexOf(event.source.name),
        this.tiposElem.length,
        parseInt(event.source.id.replace('tipo_', '')) - 1
      );
      this.filterService.addFilter(this.filtroTipo);

      this.filterControlService.tiposSelected[parseInt(event.source.id.replace('tipo_', '')) - 1] = true;

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

      this.filterControlService.tiposSelected[parseInt(event.source.id.replace('tipo_', '')) - 1] = false;

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
        coloresCategoria.push(GLOBAL.colores_tipos[i]);
        numsCategoria.push(i);
      }
    });
    this.labelsCategoria = labelsCategoria;
    this.coloresCategoria = coloresCategoria;
    this.numsCategoria = numsCategoria;
  }
}
