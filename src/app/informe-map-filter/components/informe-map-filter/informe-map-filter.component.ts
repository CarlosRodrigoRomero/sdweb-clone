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
  public areas: UserAreaInterface[] = [];
  public areas$: Observable<UserAreaInterface[]>;
  public filters: UserAreaInterface[] = [];
  public filters$: Observable<UserAreaInterface[]>;
  public mapType = 'satellite';

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
  }

  onMapReady(map) {
    this.map = map;
    this.plantaService.initMap(this.planta, map);
  }

  getStrokeColor(severidad: number) {
    return GLOBAL.colores_severidad[severidad - 1];
  }

  initDrawingManager() {
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
      const filter = this.createFilter(area);
      this.addFilter(filter);
      // this.addArea(area);
      this.addPolygonToMap(area);

      if (polygon.type !== google.maps.drawing.OverlayType.MARKER) {
        // cambio a modo no-dibujo
        drawingManager.setDrawingMode(null);
      }
    });
  }

  private createFilter(area: FilterAreaInterface): FilterInterface {
    const filter = {} as FilterInterface;
    filter.id = area.userId;
    filter.type = 'area';
    filter.area = area;

    return filter;
  }

  addFilter(filter: FilterInterface) {
    this.filterService.addFilter(filter);
  }

  /* addArea(area: FilterAreaInterface) {
    this.filterService.addArea(area);
  } */

  createArea(path: LatLngLiteral[]): FilterAreaInterface {
    this.filters$ = this.filterService.getAllFilters();
    this.filters$.subscribe((filters) => (this.filters = filters));
    const area = {} as FilterAreaInterface;
    area.userId = 'Área ' + (this.filters.length + 1);
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
