import { Injectable } from '@angular/core';

import { UserAreaInterface } from '../models/userArea';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public pointList: { lat: number; lng: number }[] = [];
  public areas: UserAreaInterface[] = [];
  public polygonList: any[] = [];

  constructor() {}

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
}
