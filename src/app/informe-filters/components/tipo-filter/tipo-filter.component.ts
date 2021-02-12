import { Component, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';

import { TipoPcFilter } from '@core/models/tipoPcFilter';

interface TipoPc {
  label?: string;
  count?: number;
  completed?: boolean;
  tiposPcs?: TipoPc[];
}

@Component({
  selector: 'app-tipo-filter',
  templateUrl: './tipo-filter.component.html',
  styleUrls: ['./tipo-filter.component.css'],
})
export class TipoFilterComponent implements OnInit {
  tiposPcs: TipoPc[] = [];
  allComplete: boolean;
  filtroTipo: TipoPcFilter;

  defaultSelect = 'Tipo de anomalía';
  selected: string[] = [this.defaultSelect];

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    this.filterService.labelsTipoPcs$.subscribe((labels) => {
      this.tiposPcs = [];
      labels.forEach((label) =>
        this.tiposPcs.push({
          label,
          count: this.filterService.getNumberOfTipoPc(label),
          completed: false,
        })
      );
    });

    this.filterService.countTipoPcs$.subscribe((counts) =>
      counts.forEach((count, i) => (this.tiposPcs[i].count = count))
    );
  }

  onChangeFiltroTipo(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroTipo = new TipoPcFilter(event.source.id, 'tipo', GLOBAL.labels_tipos.indexOf(event.source.name));
      this.filterService.addFilter(this.filtroTipo);

      // añadimos el tipo seleccionado a la variable
      if (this.selected[0] !== this.defaultSelect) {
        this.selected.push(event.source.name);
      } else {
        this.selected = [event.source.name];
      }
    } else {
      this.filterService.filters
        .filter((filter) => filter.type === 'tipo')
        .forEach((filter) => {
          if (filter.id === event.source.id) {
            this.filterService.deleteFilter(filter);
          }
        });

      // eliminamos el 'tipo' de seleccionados
      this.selected = this.selected.filter((sel) => sel !== event.source.name);
      // si era el último ponemos el label por defecto
      if (this.selected.length === 0) {
        this.selected.push(this.defaultSelect);
      }
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }
}
