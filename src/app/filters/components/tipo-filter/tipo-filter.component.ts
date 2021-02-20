import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { take } from 'rxjs/operators';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { MapControlService } from 'src/app/planta-report/services/map-control.service';

import { TipoPcFilter } from '@core/models/tipoPcFilter';
import { Anomalia } from '@core/models/anomalia';

interface LabelTipo {
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
  tiposPcs: LabelTipo[] = [];
  allComplete: boolean;
  filtroTipo: TipoPcFilter;
  filterTipoCounts: number[] = [];

  defaultStatus = true;
  defaultSelect = 'Tipo de anomalía';
  selected: string[] = [this.defaultSelect];

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
    private mapControlService: MapControlService
  ) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];
    const informeId = this.informesList[1];

    this.anomaliaService.getAnomaliasPlanta$(this.plantaId).subscribe((anomalias) => {
      this.tiposPcs = [];
      // obtenermos los labels de todas las anomalias
      this._getAllCategorias(anomalias);
      this.labelsCategoria.forEach((label, i) => {
        this.tiposPcs.push({ label, color: this.coloresCategoria[i] });
      });
      this.numsCategoria.forEach((num) => {
        this.filterTipoCounts.push(
          this.allAnomalias.filter((elem) => elem.informeId === informeId).filter((elem) => elem.tipo === num).length
        );
      });
    });

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
  }

  onChangeFiltroTipo(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroTipo = new TipoPcFilter(event.source.id, 'tipo', GLOBAL.labels_tipos.indexOf(event.source.name));
      this.filterService.addFilter(this.filtroTipo);

      // añadimos el tipo seleccionado a la variable
      if (this.selected[0] !== this.defaultSelect) {
        this.selected.push(event.source.name);
      } else {
        this.defaultStatus = false;
        this.selected = [event.source.name];
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

      // eliminamos el 'tipo' de seleccionados
      this.selected = this.selected.filter((sel) => sel !== event.source.name);
      // si era el último ponemos el label por defecto
      if (this.selected.length === 0) {
        this.defaultStatus = true;
        this.selected.push(this.defaultSelect);
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
