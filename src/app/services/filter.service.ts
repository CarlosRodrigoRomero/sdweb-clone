import { Injectable } from '@angular/core';

import { UserAreaInterface } from '../models/userArea';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public pointList: { lat: number; lng: number }[] = [];
  public area: UserAreaInterface;
  public areas: UserAreaInterface[] = [];
  public polygonList: any = [];

  constructor() {}

  addArea(path: any, polygon: any) {
    this.area = { userId: 'Área ' + (this.areas.length + 1), path: path };
    this.areas.push(this.area);
    this.polygonList.push(polygon);
  }

  getAllAreas() {
    return this.areas;
  }

  deleteArea(area: UserAreaInterface) {
    const index = this.areas.indexOf(area);

    if (index >= 0) {
      this.areas.splice(index, 1);
    }
  }
}
