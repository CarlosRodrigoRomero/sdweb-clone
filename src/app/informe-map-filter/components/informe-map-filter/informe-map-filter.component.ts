import { Component, OnInit, ViewChild } from '@angular/core';
import { GLOBAL } from '@core/services/global';
import { LatLngLiteral, Polygon } from '@agm/core';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { UserAreaInterface } from '@core/models/userArea';
import { FilterInterface } from '@core/models/filter';
import { FilterAreaInterface } from '@core/models/filterArea';

import { PcService } from '@core/services/pc.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';
import { FilterService } from '@core/services/filter.service';
import { Observable } from 'rxjs';
import { filter, map, count, take } from 'rxjs/operators';

declare const google: any;

@Component({
  selector: 'app-informe-map-filter',
  templateUrl: './informe-map-filter.component.html',
  styleUrls: ['./informe-map-filter.component.css'],
})
export class InformeMapFilterComponent implements OnInit {
  public map: any;
  public planta: PlantaInterface;
  public informe: InformeInterface;
  public circleRadius: number;
  public areaFilters: FilterInterface[] = [];
  public areaFilters$: Observable<FilterInterface[]>;
  public filters: FilterInterface[] = [];
  public filters$: Observable<FilterInterface[]>;
  public mapType = 'satellite';
  public numAreas = 0;

  constructor(
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService,
    public pcService: PcService
  ) {}

  ngOnInit(): void {
    this.planta = this.plantaService.get();
    this.informe = this.informeService.get();
    this.circleRadius = 5;

    if (this.planta.tipo === 'fija') {
      this.circleRadius = 2;
    } else if (this.planta.tipo === '1 eje') {
      this.circleRadius = 2;
    }

    // filtro de prueba
    const areaFilter = { id: 'Filtro 1', type: 'otro' } as FilterInterface;
    this.addFilter(areaFilter);
  }

  onMapReady(map) {
    this.map = map;
    this.plantaService.initMap(this.planta, map);
  }

  getStrokeColor(severidad: number) {
    return GLOBAL.colores_severidad[severidad - 1];
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
      const area = this.createArea(path);
      const areaFilter = this.createFilter(area);

      this.addFilter(areaFilter);

      this.addPolygonToMap(area);

      if (polygon.type !== google.maps.drawing.OverlayType.MARKER) {
        // cambio a modo no-dibujo
        drawingManager.setDrawingMode(null);
      }
    });
  }

  private createFilter(area: FilterAreaInterface): FilterInterface {
    const areaFilter = {} as FilterInterface;
    areaFilter.id = area.userId;
    areaFilter.type = 'area';
    areaFilter.area = area;

    return areaFilter;
  }

  addFilter(areaFilter: FilterInterface) {
    this.filterService.addFilter(areaFilter);
  }

  /* addArea(area: FilterAreaInterface) {
    this.filterService.addArea(area);
  } */

  getAllAreaFilters(): Observable<FilterInterface[]> {
    this.filters$ = this.filterService.getAllFilters();

    return this.filters$.pipe(map((filters) => filters.filter((f) => f.type === 'area')));
  }

  createArea(path: LatLngLiteral[]): FilterAreaInterface {
    const area = {} as FilterAreaInterface;
    area.userId = 'Área ' + this.numAreas;
    area.path = path;

    this.addPolygonToArea(area);

    return area;
  }

  private addPolygonToMap(area: FilterAreaInterface) {
    area.polygon.setMap(this.map);
  }

  private addPolygonToArea(area: FilterAreaInterface) {
    area.polygon = new google.maps.Polygon({
      paths: area.path,
      strokeWeight: 2,
      editable: false,
      draggable: false,
      id: area.id,
    });
  }
}
