import { Component, OnInit, ViewChild } from '@angular/core';
import { GLOBAL } from '@core/services/global';
import { LatLngLiteral } from '@agm/core';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { UserAreaInterface } from '@core/models/userArea';

import { PcService } from '@core/services/pc.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';
import { FilterService } from '@core/services/filter.service';

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
  public areas: UserAreaInterface[];
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
      this.createArea(path);
      if (polygon.type !== google.maps.drawing.OverlayType.MARKER) {
        // cambio a modo no-dibujo
        drawingManager.setDrawingMode(null);
      }
    });
  }

  addArea(area: UserAreaInterface) {
    this.filterService.addArea(area);
  }

  createArea(path: LatLngLiteral[]) {
    this.areas = this.filterService.getAllAreas();
    const area = {} as UserAreaInterface;
    area.userId = 'Área ' + (this.areas.length + 1);
    area.path = path;

    this.addArea(area);

    this.addPolygonToMap(area);
  }

  private addPolygonToMap(area: UserAreaInterface) {
    // area.visible = true;
    const polygon = new google.maps.Polygon({
      paths: area.path,
      // strokeColor: area.hasOwnProperty('modulo') ? 'yellow' : 'white',
      // strokeOpacity: this._strokeOpacity,
      strokeWeight: 2,
      // fillColor: this.getFillColor(area),
      // fillOpacity: this._fillOpacity,
      editable: false,
      draggable: false,
      id: area.id,
    });
    polygon.setMap(this.map);
    this.filterService.addPolygon(polygon);
  }
}
