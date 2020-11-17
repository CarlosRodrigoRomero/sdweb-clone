import { Component, OnInit, ViewChild } from '@angular/core';

import { PcService } from '../../../services/pc.service';

import { PlantaInterface } from '../../../models/planta';
import { InformeInterface } from '../../../models/informe';
import { UserAreaInterface } from '../../../models/userArea';

import { PlantaService } from '../../../services/planta.service';
import { InformeService } from '../../../services/informe.service';
import { FilterService } from '../../../services/filter.service';
import { GLOBAL } from 'src/app/services/global';
import { LatLngLiteral } from '@agm/core';

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
  public area: UserAreaInterface;
  public areas: UserAreaInterface[];
  public mapType = 'satellite';
  public pointList: { lat: number; lng: number }[] = [];
  public selectedArea = 0;
  public selectedShape: any;

  constructor(
    private plantaService: PlantaService,
    private informeService: InformeService,
    private filterService: FilterService,
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
    
    /* google.maps.event.addListener(drawingManager, 'overlaycomplete', (event) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const paths = event.overlay.getPaths();
        for (let p = 0; p < paths.getLength(); p++) {
          google.maps.event.addListener(paths.getAt(p), 'set_at', () => {
            if (!event.overlay.drag) {
              this.updatePointList(event.overlay.getPath());
            }
          });
          google.maps.event.addListener(paths.getAt(p), 'insert_at', () => {
            this.updatePointList(event.overlay.getPath());
          });
          google.maps.event.addListener(paths.getAt(p), 'remove_at', () => {
            this.updatePointList(event.overlay.getPath());
          });
        }
        this.updatePointList(event.overlay.getPath());
        this.selectedShape = event.overlay;
        this.selectedShape.type = event.type;
      }
      if (event.type !== google.maps.drawing.OverlayType.MARKER) {
        // Switch back to non-drawing mode after drawing a shape.
        drawingManager.setDrawingMode(null);
        this.addArea(event.overlay.getPath());
      }
    }); */
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
      this.addArea(path, polygon);
      this.updateAreas();
    });
  }

  private createUserArea(path: LatLngLiteral[]) {
    let userArea = {} as UserAreaInterface;
    userArea.userId = '';
    userArea.path = path;

    // userArea = this.plantaService.addUserArea(this.plantaId, userArea);
    this.areas.push(userArea);
    // this.selectArea(userArea);

    //this.addPolygonToMap(userArea, true);
  }

  deleteSelectedShape() {
    if (this.selectedShape) {
      this.selectedShape.setMap(null);
      this.selectedArea = 0;
      this.pointList = [];
    }
  }

  addArea(path, polygon: any) {
    this.filterService.addArea(path, polygon);
  }

  /* private addPolygonToMap(area: AreaInterface, isNew = false) {
    // area.visible = true;
    const polygon = new google.maps.Polygon({
      paths: area.path,
      strokeColor: area.hasOwnProperty('modulo') ? 'yellow' : 'white',
      strokeOpacity: this._strokeOpacity,
      strokeWeight: 2,
      fillColor: this.getFillColor(area),
      fillOpacity: this._fillOpacity,
      editable: isNew,
      draggable: isNew,
      id: area.id,
    });
    polygon.setMap(this.map);
    this.polygonList.push(polygon);
    if (isNew) {
      this.selectArea(area);
    }
    google.maps.event.addListener(polygon, 'mouseup', (event) => {
      this.selectArea(area);
      this.modifyArea(area);
    });
  } */

  updateAreas() {
    this.areas = this.filterService.getAllAreas();
    console.log(this.areas);
    for (let i = 0; i <= this.areas.length; i++) {
      const polygon = new google.maps.Polygon({paths: this.areas[i].path});
      polygon.setMap(this.map);
    }
  }

  updatePointList(path) {
    this.pointList = [];
    const len = path.getLength();
    for (let i = 0; i < len; i++) {
      this.pointList.push(path.getAt(i).toJSON());
    }
  }
}
