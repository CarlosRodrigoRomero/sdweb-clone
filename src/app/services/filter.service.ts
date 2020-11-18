import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { UserAreaInterface } from '../models/userArea';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PcInterface } from '../models/pc';

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

  areaToFilteredPcs() {
    this.pcService.currentFilteredPcs$.subscribe((pc) => {
      this.arrayPcs = pc;
    });
  }
}
