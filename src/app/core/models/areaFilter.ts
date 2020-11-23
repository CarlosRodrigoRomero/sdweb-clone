import { FilterInterface } from './filter';
import { PcInterface } from './pc';
import { LatLngLiteral } from '@agm/core';

export class AreaFilter implements FilterInterface {
  id: string;
  archivo: string;
  path: LatLngLiteral[];
  filteredPcs: any;
  filteredPcs$: any;

  constructor(areaFilter: AreaFilter) {}

  applyFilter(pcs: PcInterface[]): PcInterface[] {
    this.filteredPcs$.next(this.filteredPcs);
    return pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, this.path));
  }
  desaplicarFiltro(pcs: PcInterface[]): PcInterface[] {
    return [];
  }

  private isContained(arg0: { lat: any; lng: any }, path: LatLngLiteral[]) {
    throw new Error('Method not implemented.');
  }
}
