import { Injectable } from '@angular/core';

import { Collection, Map, View } from 'ol';
import { Control } from 'ol/control';
import { Interaction } from 'ol/interaction';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OlMapService {
  private map = {};
  private map$ = new BehaviorSubject<any>(this.map);

  constructor() {}

  createMap(
    id: string,
    layers: BaseLayer[] | Collection<BaseLayer> | LayerGroup,
    view: View,
    controls?: Collection<Control> | Control[]
  ): Observable<any> {
    this.map = new Map({
      target: id,
      layers,
      view,
      controls,
    });
    this.map$.next(this.map);
    return this.map$.asObservable();
  }

  getMap(): Observable<any> {
    return this.map$.asObservable();
  }
}
