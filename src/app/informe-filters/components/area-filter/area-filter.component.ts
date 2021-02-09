import { Component, OnInit } from '@angular/core';
import { LatLngLiteral } from '@agm/core';

import { BehaviorSubject, Observable } from 'rxjs';

import {Draw, Modify, Snap} from 'ol/interaction';

import { FilterService } from '@core/services/filter.service';

import { AreaFilter } from '@core/models/areaFilter';
import { FilterInterface } from '@core/models/filter';

declare const google: any;

@Component({
  selector: 'app-area-filter',
  templateUrl: './area-filter.component.html',
  styleUrls: ['./area-filter.component.css'],
})
export class AreaFilterComponent implements OnInit {
  removable = true;
  public areaFilters$: Observable<FilterInterface[]>;
  public map: any;
  public numAreas = 0;

  draw: Draw;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    this.areaFilters$ = this.filterService.getAllFilters();
  }

  deleteFilter(filter: FilterInterface) {
    this.filterService.deleteFilter(filter);
  }

  deleteAllTypeFilters(type: string) {
    this.filterService.deleteAllTypeFilters(type);
  }

  /* initDrawingManager() {
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
      const areaFilter = new AreaFilter('Área ' + this.numAreas, 'area', path);
      this.filterService.addFilter(areaFilter);

      // Desactiva del modo dibujo
      if (polygon.type !== google.maps.drawing.OverlayType.MARKER) {
        drawingManager.setDrawingMode(null);
      }
    });
  }

  numberToLatLng(paths: Array<Array<number>>): Array<Array<LatLngLiteral>> {
    console.log(paths);
    const newPaths = [];
    for (let i = 0; i <= paths.length; i++) {
      const path = [];
      for (let j = 0; j <= paths[i].length; j++) {
        path.push(new google.maps.LatLng(paths[i][j][0], paths[i][j][1]));
      }
      newPaths.push(path);
    }
    return newPaths;
  } */
}
