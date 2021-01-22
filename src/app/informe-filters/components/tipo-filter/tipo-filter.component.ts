import { Component, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { GLOBAL } from '@core/services/global';
import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { TipoPcFilter } from '@core/models/tipoPcFilter';

interface TipoPc {
  label: string;
  completed: boolean;
  tiposPcs?: TipoPc[];
}

@Component({
  selector: 'app-tipo-filter',
  templateUrl: './tipo-filter.component.html',
  styleUrls: ['./tipo-filter.component.css'],
})
export class TipoFilterComponent implements OnInit {
  tiposTask: TipoPc;
  tiposPcs: TipoPc[] = [];
  allComplete: boolean;
  filtroTipo: TipoPcFilter;

  constructor(private pcService: PcService, private filterService: FilterService) {}

  ngOnInit(): void {
    this.pcService.getLabelsTipoPcs().forEach((label) =>
      this.tiposPcs.push({
        label,
        completed: false,
      })
    );
    console.log(this.tiposPcs);
    this.tiposTask = {
      label: 'Todos',
      completed: true,
      tiposPcs: this.tiposPcs,
    };
  }

  onChangeFiltroTipo(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroTipo = new TipoPcFilter(event.source.id, 'tipo', GLOBAL.labels_tipos.indexOf(event.source.name));
      this.filterService.addFilter(this.filtroTipo);
    } else {
      this.filterService.filters
        .filter((filter) => (filter.type = 'tipo'))
        .forEach((filter) => {
          if (filter.id === event.source.id) {
            this.filterService.deleteFilter(filter);
          }
        });
    }
  }
}
