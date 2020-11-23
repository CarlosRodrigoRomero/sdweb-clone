import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '../models/pc';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { LatLngLiteral } from '@agm/core';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filters: FilterInterface[] = [];
  private filters$ = new Subject<FilterInterface[]>();
  private pcsAreas: PcInterface[] = [];
  public pcsAreas$ = new Subject<PcInterface[]>();
  public areaFilters: FilterInterface[] = [];

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

    this.deletePcsByArea(filter.area.path);
  }

  getByTypeFilters(type: string): Observable<FilterInterface[]> {
    return this.filters$.pipe(map((filters) => filters.filter((f) => f.type === type)));
  }

  filterPcsByArea(path: LatLngLiteral[]) {
    this.getAllPcs()
      .pipe(map((pcs) => pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, path))))
      .subscribe((pcs) => pcs.map((pc) => this.pcsAreas.push(pc)));

    this.pcsAreas$.next(this.pcsAreas);
    /* this.getAllPcs()
      .pipe(map((pcs) => pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, path))))
      .subscribe((pcs) => pcs.map((pc) => this.filters.map((f) => f.area.pcs.push(pc))));

    this.allPcsByAreaFiltered(); */
  }

  /* allPcsByAreaFiltered() {
    const areaFilter: FilterInterface[] = this.filters.filter((f) => (f.type = 'area'));
    for (let i = 0; i <= areaFilter.length; i++) {
      for (let j = 0; j <= areaFilter[i].area.pcs.length; j++) {
        this.pcsAreas.push(areaFilter[i].area.pcs[j]);
      }
    }
    this.pcsAreas$.next(this.pcsAreas);
  } */

  deletePcsByArea(path: LatLngLiteral[]) {
    this.getAllPcs()
      .pipe(map((pcs) => pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, path))))
      .subscribe((pcs) => pcs.map((pc) => this.pcsAreas.splice(this.pcsAreas.indexOf(pc), 1)));
    this.pcsAreas$.next(this.pcsAreas);
  }

  getAllPcs(): Observable<PcInterface[]> {
    return this.pcService.allPcs$;
  }

  private isContained(point: LatLngLiteral, path: LatLngLiteral[]) {
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
