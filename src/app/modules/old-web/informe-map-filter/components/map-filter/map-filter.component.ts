import { Component, OnInit, ViewChild } from '@angular/core';
import { GLOBAL } from '@data/constants/global';
import { LatLngLiteral } from '@agm/core';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { FilterInterface } from '@core/models/filter';

import { PcService } from '@data/services/pc.service';
import { PlantaService } from '@data/services/planta.service';
import { InformeService } from '@data/services/informe.service';
import { FilterService } from '@data/services/filter.service';
import { Observable } from 'rxjs';
import { AreaFilter } from '@core/models/areaFilter';

declare const google: any;
@Component({
  selector: 'app-map-filter',
  templateUrl: './map-filter.component.html',
  styleUrls: ['./map-filter.component.css'],
})
export class MapFilterComponent implements OnInit {
  public map: any;
  public planta: PlantaInterface;
  public informe: InformeInterface;
  public circleRadius: number;
  public mapType = 'satellite';
  public numAreas = 0;

  public areaFilterList: AreaFilter[] = [];
  public filters: FilterInterface[] = [];
  public filters$: Observable<FilterInterface[]>;

  constructor(
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService,
    public pcService: PcService
  ) {
    // mostramos todos los pcs al inicio
    this.filterService.filteredElements = this.pcService.allPcs;
  }

  ngOnInit(): void {
    this.planta = this.plantaService.get();
    this.informe = this.informeService.get();
    this.circleRadius = 5;

    if (this.planta.tipo === 'fija') {
      this.circleRadius = 2;
    } else if (this.planta.tipo === '1 eje') {
      this.circleRadius = 2;
    }
  }

  onMapReady(map) {
    this.map = map;
    this.plantaService.initMap(this.planta, map);

    this.filterService.filters$.subscribe((filtros) => {
      // 1. Borramos todos los poligonos del mapa
      this.areaFilterList.forEach((filtroArea) => {
        // filtroArea.polygon.setMap(null);
      });
      this.areaFilterList = [];

      // 2. Los dibujamos de nuevo
      filtros
        .map((filtro) => {
          if (filtro instanceof AreaFilter) {
            return filtro as AreaFilter;
          }
        })
        .forEach((filtro) => {
          this.areaFilterList.push(filtro);
          // filtro.polygon.setMap(this.map);
        });
    });
  }

  getStrokeColor(severidad: number) {
    return GLOBAL.colores_clase[severidad - 1];
  }

  initDrawingManager() {
    this.numAreas++;
    const options = {
      drawingControl: false,
      polygonOptions: {
        draggable: false,
        editable: false,
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    };

    const drawingManager = new google.maps.drawing.DrawingManager(options);
    drawingManager.setMap(this.map);

    this.addEventListeners(drawingManager);
  }

  addEventListeners(drawingManager: any) {
    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon) => {
      polygon.setMap(null);
      const path: LatLngLiteral[] = [];
      for (let i = 0; i < polygon.getPath().getLength(); i++) {
        path.push({
          lat: polygon.getPath().getAt(i).lat() as number,
          lng: polygon.getPath().getAt(i).lng() as number,
        });
      }

      // Creamos el filtro
      const areaFilter = null;
      // const areaFilter = new AreaFilter('Área ' + this.numAreas, path);
      this.filterService.addFilter(areaFilter);

      // Desactiva del modo dibujo
      if (polygon.type !== google.maps.drawing.OverlayType.MARKER) {
        drawingManager.setDrawingMode(null);
      }
    });
  }
}
