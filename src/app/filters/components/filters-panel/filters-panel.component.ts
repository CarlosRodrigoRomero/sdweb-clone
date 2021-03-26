import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FilterService } from '@core/services/filter.service';
import { OlMapService } from '@core/services/ol-map.service';
import { FilterControlService } from '@core/services/filter-control.service';

@Component({
  selector: 'app-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.css'],
})
export class FiltersPanelComponent implements OnInit {
  private tipoSeguidores = 'planta-seguidores';
  public esTipoSeguidores = false;

  constructor(
    private filterService: FilterService,
    private olMapService: OlMapService,
    private router: Router,
    private filterControlService: FilterControlService
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes(this.tipoSeguidores)) {
      this.esTipoSeguidores = true;
    }
  }

  cleanFilters() {
    // borra todos los filtros
    this.filterService.deleteAllFilters();

   /*  // elimina el poligono del mapa
    this.olMapService.deleteAllDrawLayers();

    this.olMapService.getMap().subscribe(map => map.removeInteraction()) */

    this.filterControlService.resetFilters();
  }
}
