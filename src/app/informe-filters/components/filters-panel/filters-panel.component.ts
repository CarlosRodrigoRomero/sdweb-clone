import { Component, OnInit } from '@angular/core';

import { FilterService } from '@core/services/filter.service';
import { OlMapService } from '@core/services/ol-map.service';

@Component({
  selector: 'app-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.css'],
})
export class FiltersPanelComponent implements OnInit {
  constructor(private filterService: FilterService, private olMapService: OlMapService) {}

  ngOnInit(): void {}

  cleanFilters() {
    // borra todos los filtros
    this.filterService.deleteAllFilters();

    // elimina el poligono del mapa
    this.olMapService.deleteAllDrawLayers();
  }
}
