import { Component, OnInit, ViewChild } from '@angular/core';

import { PcService } from '../../../services/pc.service';

import { PlantaInterface } from '../../../models/planta';
import { InformeInterface } from '../../../models/informe';
import { UserAreaInterface } from '../../../models/userArea';

import { PlantaService } from '../../../services/planta.service';
import { InformeService } from '../../../services/informe.service';
import { FilterService } from '../../../services/filter.service';
import { GLOBAL } from 'src/app/services/global';

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
  public drawingManager: any;
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
        draggable: true,
        editable: true,
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    };

    this.drawingManager = new google.maps.drawing.DrawingManager(options);
    this.drawingManager.setMap(this.map);
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event) => {
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
        this.drawingManager.setDrawingMode(null);
        this.addArea(event.overlay.getPath());
      }
    });
  }

  deleteSelectedShape() {
    if (this.selectedShape) {
      this.selectedShape.setMap(null);
      this.selectedArea = 0;
      this.pointList = [];
      // To show:
      this.drawingManager.setOptions({
        drawingControl: true,
      });
    }
  }

  addArea(path) {
    this.filterService.addArea(path);
  }

  updateAreas() {
    this.areas = this.filterService.getAllAreas();
    for (let i = 0; i <= this.areas.length; i++) {
      google.maps.geometry.spherical.computeArea(this.areas[i]);
    }
  }

  updatePointList(path) {
    this.pointList = [];
    const len = path.getLength();
    for (let i = 0; i < len; i++) {
      this.pointList.push(path.getAt(i).toJSON());
    }
    // google.maps.geometry.spherical.computeArea(path);
  }
}
