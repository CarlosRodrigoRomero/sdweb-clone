import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { FilterAreaInterface } from '@core/models/filterArea';
import { PcInterface } from '../models/pc';

import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { LatLngLiteral } from '@agm/core';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filters: FilterInterface[] = [];
  private filters$ = new Subject<FilterInterface[]>();
  public pcsAreas: PcInterface[] = [];
  public pcsAreas$ = new Subject<PcInterface[]>();

  public pointList: { lat: number; lng: number }[] = [];
  public areas: FilterAreaInterface[] = [];
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

  getByTypeAllFilters(type: string): Observable<FilterInterface[]> {
    return this.filters$.pipe(map((filters) => filters.filter((f) => f.type === type)));
  }

  pcsByAreaFiltered() {
    if (this.filters.length > 0) {
      for (let i = 0; i <= this.filters.length; i++) {
        this.getAllPcs()
          .pipe(
            map((pcs) =>
              pcs.filter((pc) => this.inside({ lat: pc.gps_lat, lng: pc.gps_lng }, this.filters[i].area.path))
            )
          )
          .subscribe((pcs) => (this.pcsAreas = pcs));
      }
      this.pcsAreas$.next(this.pcsAreas);
    }

    /* return this.getAllPcs().pipe(
      map((pcs) =>
        pcs.filter((pc) =>
          this.getByTypeAllFilters('area').pipe(
            map((fs) => fs.filter((f) => this.inside({ lat: pc.gps_lat, lng: pc.gps_lng }, f.area.path)))
          )
        )
      )
    ); */
  }

  getAllPcs(): Observable<PcInterface[]> {
    return this.pcService.allPcs$;
  }

  /*  isIn(point: LatLngLiteral, path: LatLngLiteral[]) {
    // Test the ray against all sides
let intersections = 0;
for (let side = 0; side <= path.length; side++) {
    // Test if current side intersects with ray.
    if (this.areIntersecting()) {
      intersections++;
    }
}
if ((intersections % 2) === 1) {
    // Inside of polygon
    return true;
} else {
    // Outside of polygon
    return false;
}
  }

  areIntersecting(
    float v1x1, float v1y1, float v1x2, float v1y2,
    float v2x1, float v2y1, float v2x2, float v2y2
) {
  const NO = 0;
  const YES = 1;
  const COLLINEAR = 2;
    // Convert vector 1 to a line (line 1) of infinite length.
    // We want the line in linear equation standard form: A*x + B*y + C = 0
    // See: http://en.wikipedia.org/wiki/Linear_equation
    const a1 = v1y2 - v1y1;
    const b1 = v1x1 - v1x2;
    const c1 = (v1x2 * v1y1) - (v1x1 * v1y2);

    // Every point (x,y), that solves the equation above, is on the line,
    // every point that does not solve it, is not. The equation will have a
    // positive result if it is on one side of the line and a negative one 
    // if is on the other side of it. We insert (x1,y1) and (x2,y2) of vector
    // 2 into the equation above.
    let d1 = (a1 * v2x1) + (b1 * v2y1) + c1;
    let d2 = (a1 * v2x2) + (b1 * v2y2) + c1;

    // If d1 and d2 both have the same sign, they are both on the same side
    // of our line 1 and in that case no intersection is possible. Careful, 
    // 0 is a special case, that's why we don't test ">=" and "<=", 
    // but "<" and ">".
    if (d1 > 0 && d2 > 0) return NO;
    if (d1 < 0 && d2 < 0) return NO;

    // The fact that vector 2 intersected the infinite line 1 above doesn't 
    // mean it also intersects the vector 1. Vector 1 is only a subset of that
    // infinite line 1, so it may have intersected that line before the vector
    // started or after it ended. To know for sure, we have to repeat the
    // the same test the other way round. We start by calculating the 
    // infinite line 2 in linear equation standard form.
    const a2 = v2y2 - v2y1;
    const b2 = v2x1 - v2x2;
    const c2 = (v2x2 * v2y1) - (v2x1 * v2y2);

    // Calculate d1 and d2 again, this time using points of vector 1.
    d1 = (a2 * v1x1) + (b2 * v1y1) + c2;
    d2 = (a2 * v1x2) + (b2 * v1y2) + c2;

    // Again, if both have the same sign (and neither one is 0),
    // no intersection is possible.
    if (d1 > 0 && d2 > 0) return NO;
    if (d1 < 0 && d2 < 0) return NO;

    // If we get here, only two possibilities are left. Either the two
    // vectors intersect in exactly one point or they are collinear, which
    // means they intersect in any number of points from zero to infinite.
    if ((a1 * b2) - (a2 * b1) == 0.0f) return COLLINEAR;

    // If they are not collinear, they must intersect in exactly one point.
    return YES;
} */

  inside(point: LatLngLiteral, path: LatLngLiteral[]) {
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

  isContained(point: LatLngLiteral, path: LatLngLiteral[]) {
    let crossings = 0;

    // por cada lado
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
    return crossings % 2 === 1;
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
