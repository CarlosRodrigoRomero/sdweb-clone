import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { Collection, Map, View } from 'ol';
import { Control } from 'ol/control';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import TileLayer from 'ol/layer/Tile';

@Injectable({
  providedIn: 'root',
})
export class OlMapService {
  private map = {};
  private map$ = new BehaviorSubject<any>(this.map);
  private drawLayers: VectorLayer[] = [];
  private thermalLayers: TileLayer[] = [];
  private thermalLayers$ = new BehaviorSubject<TileLayer[]>(this.thermalLayers);
  private anomaliaLayers: VectorLayer[] = [];
  private anomaliaLayers$ = new BehaviorSubject<VectorLayer[]>(this.anomaliaLayers);
  private seguidorLayers: VectorLayer[] = [];
  private seguidorLayers$ = new BehaviorSubject<VectorLayer[]>(this.seguidorLayers);
  private incrementoLayers: VectorLayer[] = [];
  private incrementoLayers$ = new BehaviorSubject<VectorLayer[]>(this.incrementoLayers);

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

  createVectorLayer(source: VectorSource): VectorLayer {
    const layer = new VectorLayer({ source });
    this.drawLayers.push(layer);

    return layer;
  }

  addThermalLayer(layer: TileLayer) {
    this.thermalLayers.push(layer);
    this.thermalLayers$.next(this.thermalLayers);
  }

  getThermalLayers() {
    return this.thermalLayers$.asObservable();
  }

  addAnomaliaLayer(layer: VectorLayer) {
    this.anomaliaLayers.push(layer);
    this.anomaliaLayers$.next(this.anomaliaLayers);
  }

  getAnomaliaLayers() {
    return this.anomaliaLayers$.asObservable();
  }

  deleteAllDrawLayers() {
    this.drawLayers.forEach((layer) => (this.map as Map).removeLayer(layer));
  }

  addSeguidorLayer(layer: VectorLayer) {
    this.seguidorLayers.push(layer);
    this.seguidorLayers$.next(this.seguidorLayers);
  }

  getSeguidorLayers() {
    return this.seguidorLayers$.asObservable();
  }

  addIncrementoLayer(layer: VectorLayer) {
    this.incrementoLayers.push(layer);
    this.incrementoLayers$.next(this.incrementoLayers);
  }

  getIncrementoLayers() {
    return this.incrementoLayers$.asObservable();
  }
}
