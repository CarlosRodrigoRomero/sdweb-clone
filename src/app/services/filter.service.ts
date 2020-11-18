import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { UserAreaInterface } from '../models/userArea';
import { Observable } from 'rxjs';
import { PcInterface } from '../models/pc';
import { LatLngLiteral } from '@agm/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public pointList: { lat: number; lng: number }[] = [];
  public areas: UserAreaInterface[] = [];
  public polygonList: any[] = [];
  public pcs$: Observable<PcInterface[]>;
  public arrayPcs: PcInterface[] = [];

  constructor(private pcService: PcService) {}

  addArea(area: UserAreaInterface) {
    this.areas.push(area);
  }

  addPolygon(polygon: any) {
    this.polygonList.push(polygon);
  }

  getAllAreas() {
    return this.areas;
  }

  getAllPolygons() {
    return this.polygonList;
  }

  deletePolygons() {
    this.polygonList = [];
  }

  deleteArea(area: UserAreaInterface) {
    const index = this.areas.indexOf(area);

    if (index >= 0) {
      this.areas.splice(index, 1);
      this.polygonList[index].setMap(null);
      this.polygonList.splice(index, 1);
    }
  }

 /*  areaToFilteredPcs(path: LatLngLiteral[]) {
    let point: LatLngLiteral;
    if (this.areas.length > 0) {
      this.pcService.currentFilteredPcs$
        .pipe(map((pcs) => pcs.filter((pc) => this.isContained((point = { lat: pc.gps_lat, lng: pc.gps_lng }), path))))
        .subscribe((pcs) => {
          this.pcService.calcularInforme(pcs);  
        });
    } else {
      this.pcService.currentFilteredPcs$.subscribe((pcs) => {
        this.calcularInforme(pcs);
      });
    }
  } */

  isContained(point: LatLngLiteral, path: LatLngLiteral[]) {
    let crossings = 0;

    // for each edge
    for (let i = 0; i < path.length; i++) {
      const a = path[i];
      let j = i + 1;
      if (j >= path.length) {
        j = 0;
      }
      const b = path[j];
      if (this.rayCrossesSegment(point, a, b)) {
        crossings++;
      }
    }
  }

  rayCrossesSegment(point: LatLngLiteral, a: LatLngLiteral, b: LatLngLiteral) {
    let px = point.lng;
    let py = point.lat;
    let ax = a.lng;
    let ay = a.lat;
    let bx = b.lng;
    let by = b.lat;

    if (ay > by) {
      ax = b.lng;
      ay = b.lat;
      bx = a.lng;
      by = a.lat;
    }

    // alter longitude to cater for 180 degree crossings
    if (px < 0) {
      px += 360;
    }
    if (ax < 0) {
      ax += 360;
    }
    if (bx < 0) {
      bx += 360;
    }

    if (py === ay || py === by) {
      py += 0.00000001;
    }
    if (py > by || py < ay || px > Math.max(ax, bx)) {
      return false;
    }
    if (px < Math.min(ax, bx)) {
      return true;
    }

    const red = ax !== bx ? (by - ay) / (bx - ax) : Infinity;
    const blue = ax !== px ? (py - ay) / (px - ax) : Infinity;

    return blue >= red;
  }
}
