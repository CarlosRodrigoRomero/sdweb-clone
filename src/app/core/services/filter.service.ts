import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { FilterAreaInterface } from '@core/models/filterArea';
import { PcInterface } from '../models/pc';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { LatLngLiteral } from '@agm/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filters: FilterInterface[] = [];
  private filters$ = new Subject<FilterInterface[]>();
  private pcsAreas: PcInterface[] = [];
  public pcsAreas$ = new Subject<PcInterface[]>();
  public areaFilters: FilterInterface[] = [];

  public pointList: { lat: number; lng: number }[] = [];
  private areas$ = new Subject<FilterAreaInterface[]>();
  public polygonList: any[] = [];
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

  getByTypeFilters(type: string): Observable<FilterInterface[]> {
    // this.pcsAreas.next(this.filters.filter((pc) => (pc.type = type)));
    return this.filters$.pipe(map((filters) => filters.filter((f) => f.type === type)));
  }

  filterPcsByArea(path: LatLngLiteral[]) {
    const areas = this.filters.filter((f) => (f.type = 'area'));
    this.getAllPcs()
          .pipe(
            map((pcs) => pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, path)))
          )
          .subscribe((pcs) => pcs.map(pc => this.pcsAreas.push(pc)));
    /* if (areas.length > 0) {
      for (let i = 0; i <= areas.length; i++) {
        this.getAllPcs()
          .pipe(
            map((pcs) => pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, areas[i].area.path)))
          )
          .subscribe((pcs) => (this.pcsAreas = pcs));
      }
    } */
    this.pcsAreas$.next(this.pcsAreas);
  }

  getAllPcs(): Observable<PcInterface[]> {
    return this.pcService.allPcs$;
  }

  isContained(point: LatLngLiteral, path: LatLngLiteral[]) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    const x = point.lat;
    const y = point.lng;

    let inside = false;

    for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
      const xi = path[i].lat;
      const yi = path[i].lng;
      const xj = path[j].lat;
      const yj = path[j].lng;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }
}
