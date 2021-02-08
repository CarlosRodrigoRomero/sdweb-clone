import { Component, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';

import { TipoPcFilter } from '@core/models/tipoPcFilter';
import { AnomaliaService } from '@core/services/anomalia.service';

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
  tiposTask: TipoPc;
  tiposPcs: TipoPc[] = [];
  allComplete: boolean;
  filtroTipo: TipoPcFilter;

  constructor(private anomaliaService: AnomaliaService, private filterService: FilterService) {}

  ngOnInit(): void {
    /* console.log(this.filterService.getLabelsTipoPcs()); */
    this.filterService.getLabelsTipoPcs().forEach((label) =>
      this.tiposPcs.push({
        label,
        completed: false,
      })
    );

    this.tiposPcs.forEach((pc) => (pc.count = this.filterService.getNumberOfTipoPc(pc.label)));

    this.tiposTask = {
      tiposPcs: this.tiposPcs,
    };
  }

  onChangeFiltroTipo(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroTipo = new TipoPcFilter(event.source.id, 'tipo', GLOBAL.labels_tipos.indexOf(event.source.name));
      this.filterService.addFilter(this.filtroTipo);
    } else {
      this.filterService.filters
        .filter((filter) => filter.type === 'tipo')
        .forEach((filter) => {
          if (filter.id === event.source.id) {
            this.filterService.deleteFilter(filter);
          }
        });
    }
  }
}
