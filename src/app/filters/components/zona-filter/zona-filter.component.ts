import { Component, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { FilterService } from '@core/services/filter.service';
import { PcService } from '@core/services/pc.service';

import { ZonaFilter } from '@core/models/zonaFilter';

interface ZonaPc {
  label?: string;
  completed?: boolean;
  zonasPcs?: ZonaPc[];
}

@Component({
  selector: 'app-zona-filter',
  templateUrl: './zona-filter.component.html',
  styleUrls: ['./zona-filter.component.css'],
})
export class ZonaFilterComponent implements OnInit {
  zonasTask: ZonaPc;
  zonasPcs: ZonaPc[] = [];
  allComplete: boolean;
  filtroZona: ZonaFilter;

  constructor(private filterService: FilterService, private pcService: PcService) {}

  ngOnInit(): void {
    this.pcService.getZonasPcs().forEach((zona) =>
      this.zonasPcs.push({
        label: zona,
        completed: false,
      })
    );

    this.zonasTask = {
      zonasPcs: this.zonasPcs,
    };
  }

  onChangeFiltroZona(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroZona = new ZonaFilter(event.source.id, 'zona', event.source.name);
      this.filterService.addFilter(this.filtroZona);
    } else {
      this.filterService.filters$.subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'zona')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
    }
  }
}
