import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { FilterAreaInterface } from '@core/models/filterArea';

import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { PcInterface } from '../models/pc';
import { LatLngLiteral } from '@agm/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filters: FilterInterface[] = [];
  private filters$ = new Subject<FilterInterface[]>();

  public pointList: { lat: number; lng: number }[] = [];
  public areas: FilterAreaInterface[] = [];
  private areas$ = new Subject<FilterAreaInterface[]>();
  public polygonList: any[] = [];
  public pcs$: Observable<PcInterface[]>;
  public arrayPcs: PcInterface[] = [];

  constructor(private pcService: PcService) {}

  addFilter(filter: FilterInterface) {
    this.filters.push(filter);
    this.filters$.next(this.filters);
  }

  getAllFilters() {
    return this.filters$.asObservable();
  }

  deleteFilter(filter: FilterInterface) {
    const index = this.filters.indexOf(filter);

    if (index >= 0) {
      this.filters[index].area.polygon.setMap(null);
      this.filters.splice(index, 1);
    }
  }

  pcsByAreaFiltered(): Observable<PcInterface[]> {
    return this.getAllPcs().pipe(
      map((pcs) =>
        pcs.filter((pc) => {
          for (let i = 0; i <= this.filters.length; i++) {
            this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, this.filters[i].area.path);
          }
        })
      )
    );
  }

  getAllPcs(): Observable<PcInterface[]> {
    return this.pcService.allPcs$;
  }

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
