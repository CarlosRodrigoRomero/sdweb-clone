import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';

import { TipoPcFilter } from '@core/models/tipoPcFilter';
import { AnomaliaService } from '@core/services/anomalia.service';
import { FormControl } from '@angular/forms';

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

  selected = 'Tipo de anomalía';

  constructor(private anomaliaService: AnomaliaService, private filterService: FilterService) {}

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
      if (this.selected !== 'Tipo de anomalía') {
        console.log(event.source.name);
        console.log(this.selected.concat(', ' + event.source.name));
        this.selected = this.selected.concat(', ' + event.source.name);
      } else {
        this.selected = event.source.name;
      }
    } else {
      this.filterService.filters
        .filter((filter) => filter.type === 'tipo')
        .forEach((filter) => {
          if (filter.id === event.source.id) {
            this.filterService.deleteFilter(filter);
          }
        });

      this.selected = this.selected.replace(event.source.name, '');
      // eliminamos el tipo de la variable
      if (this.selected === '') {
        this.selected = 'Tipo de anomalía';
      }
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }
}
