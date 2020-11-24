import { FilterInterface } from './filter';
import { PcInterface } from './pc';
import { LatLngLiteral } from '@agm/core';
declare const google: any;

export class AreaFilter implements FilterInterface {
  id: string;
  path: LatLngLiteral[];
  polygon: any;

  constructor(path: LatLngLiteral[]) {
    this.path = path;
    this.polygon = this.getGooglePolygonFromPath(path);
  }

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    return pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, this.path));
  }
  desaplicarFiltro(pcs: PcInterface[]): PcInterface[] {
    return [];
  }

  private isContained(arg0: { lat: any; lng: any }, path: LatLngLiteral[]) {
    throw new Error('Method not implemented.');
  }
  private getGooglePolygonFromPath(path: LatLngLiteral[]) {
    return new google.maps.Polygon({
      paths: path,
      strokeWeight: 2,
      editable: false,
      draggable: false,
      id: this.id,
    });
  }
}
