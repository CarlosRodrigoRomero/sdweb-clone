import { Component, OnInit, ViewChild } from '@angular/core';

import { PcService } from '../../../services/pc.service';

import { PlantaInterface } from '../../../models/planta';
import { InformeInterface } from '../../../models/informe';
import { UserAreaInterface } from '../../../models/userArea';
import { SelectionModel } from '@angular/cdk/collections';

import { PlantaService } from '../../../services/planta.service';
import { InformeService } from '../../../services/informe.service';
import { GLOBAL } from 'src/app/services/global';
import { LocationAreaInterface } from 'src/app/models/location';

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
  public userAreaList: UserAreaInterface[];
  public mapLoaded = false;
  public mapType = 'satellite';
  public drawingManager: any;
  public pointList: { lat: number; lng: number }[] = [];
  public selectedArea = 0;

  constructor(
    private plantaService: PlantaService,
    private informeService: InformeService,
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

    this.plantaService.getUserAreas$(this.planta.id).subscribe((userAreas) => {
      this.userAreaList = userAreas;
    });
  }

  mapIsReady(map) {
    this.mapLoaded = true;
    this.plantaService.initMap(this.planta, map);
  }

  getStrokeColor(severidad: number) {
    return GLOBAL.colores_severidad[severidad - 1];
  }

  initDrawingManager(map: any) {
    const self = this;
    const options = {
      drawingControl: true,
      drawingControlOptions: {
        drawingModes: ['polygon'],
      },
      polygonOptions: {
        draggable: true,
        editable: true,
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    };

    this.drawingManager = new google.maps.drawing.drawingManager(options);
    this.drawingManager.setMap(map);
    google.maps.event.addListener(this.drawingManager, 'overlatecomplete', (event) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const paths = event.overlay.getPaths();
        for (let p = 0; p < paths.getLength(); p++) {
          google.maps.event.addListener(paths.getAt(p), 'set_at', () => {
            if (!event.overlay.drag) {
              self.updatePointList(event.overlay.getPath());
            }
          });
          google.maps.event.addListener(paths.getAt(p), 'insert_at', () => {
            self.updatePointList(event.overlay.getPath());
          });
          google.maps.event.addListener(paths.getAt(p), 'remove_at', () => {
            self.updatePointList(event.overlay.getPath());
          });
        }
        self.updatePointList(event.overlay.getPath());
      }
      if (event.type !== google.maps.drawing.OverlayType.MARKER) {
        // Switch back to non-drawing mode after drawing a shape.
        self.drawingManager.setDrawingMode(null);
        // To hide:
        self.drawingManager.setOptions({
          drawingControl: false,
        });
      }
    });

    // this.addEventListeners(drawingManager);
  }

  updatePointList(path) {
    this.pointList = [];
    const len = path.getLength();
    for (let i = 0; i < len; i++) {
      this.pointList.push(path.getAt(i).toJSON());
    }
    this.selectedArea = google.maps.geometry.spherical.computeArea(path);
  }
}
