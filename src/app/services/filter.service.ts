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

  constructor() {}

  addArea(path: any) {
    this.pointList = [];
    const len = path.getLength();
    for (let i = 0; i < len; i++) {
      this.pointList.push(path.getAt(i).toJSON());
    }
    this.areas.push((this.area = { userId: 'Área ' + (this.areas.length + 1) }));
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
  updateAreas() {
    google.maps.geometry.spherical.computeArea(this.areas);
  }
}
