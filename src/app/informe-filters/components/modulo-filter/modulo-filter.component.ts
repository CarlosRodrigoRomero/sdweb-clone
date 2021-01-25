import { Component, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { GLOBAL } from '@core/services/global';
import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { ModuloPcFilter } from '@core/models/moduloFilter';

interface ModuloPc {
  label?: string;
  completed?: boolean;
  modulosPcs?: ModuloPc[];
}

@Component({
  selector: 'app-modulo-filter',
  templateUrl: './modulo-filter.component.html',
  styleUrls: ['./modulo-filter.component.css'],
})
export class ModuloFilterComponent implements OnInit {
  modulosTask: ModuloPc;
  modulosPcs: ModuloPc[] = [];
  allComplete: boolean;
  filtroModulo: ModuloPcFilter;

  constructor(private pcService: PcService, private filterService: FilterService) {}

  ngOnInit(): void {
    this.pcService.getModulosPcs().forEach((modulo) =>
      this.modulosPcs.push({
        label: modulo,
        completed: false,
      })
    );

    this.modulosTask = {
      modulosPcs: this.modulosPcs,
    };
  }

  onChangeFiltroModulo(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroModulo = new ModuloPcFilter(event.source.id, 'modulo', event.source.name);
      this.filterService.addFilter(this.filtroModulo);
    } else {
      this.filterService.filters
        .filter((filter) => filter.type === 'modulo')
        .forEach((filter) => {
          if (filter.id === event.source.id) {
            this.filterService.deleteFilter(filter);
          }
        });
    }
  }
}
