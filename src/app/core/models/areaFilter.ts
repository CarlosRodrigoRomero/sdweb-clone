import { FilterInterface } from './filter';
import { LatLngLiteral, Polygon } from '@agm/core';
import { FiltrableInterface } from './filtrableInterface';

declare const google: any;

export class AreaFilter implements FilterInterface {
  id: string;
  type: string;
  path: LatLngLiteral[];
  polygon: Polygon;

  constructor(id: string, type: string, path: LatLngLiteral[]) {
    this.id = id;
    this.type = type;
    this.path = path;
    this.polygon = this.getGooglePolygonFromPath(path);
  }

  applyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, this.path));
  }
  unapplyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return pcs.filter(pc => !this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, this.path));
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

  private getGooglePolygonFromPath(path: LatLngLiteral[]) {
    return new google.maps.Polygon({
      id: this.id,
      paths: path,
      strokeWeight: 2,
      editable: false,
      draggable: false,
    });
  }
}
