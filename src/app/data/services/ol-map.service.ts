import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { LatLngLiteral } from '@agm/core';

import { Collection, Map, View } from 'ol';
import { Control } from 'ol/control';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import TileLayer from 'ol/layer/Tile';
import { Draw } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';
import { fromLonLat } from 'ol/proj';

@Injectable({
  providedIn: 'root',
})
export class OlMapService {
  private _map = undefined;
  public map$ = new BehaviorSubject<any>(this._map);
  private _draw: Draw = undefined;
  public draw$ = new BehaviorSubject<Draw>(this._draw);
  private drawLayers: VectorLayer[] = [];
  private thermalLayers: TileLayer[] = [];
  private thermalLayers$ = new BehaviorSubject<TileLayer[]>(this.thermalLayers);
  private anomaliaLayers: VectorLayer[] = [];
  private anomaliaLayers$ = new BehaviorSubject<VectorLayer[]>(this.anomaliaLayers);
  private seguidorLayers: VectorLayer[] = [];
  private seguidorLayers$ = new BehaviorSubject<VectorLayer[]>(this.seguidorLayers);
  private incrementoLayers: VectorLayer[] = [];
  private incrementoLayers$ = new BehaviorSubject<VectorLayer[]>(this.incrementoLayers);
  private aerialLayers: TileLayer[] = [];
  private aerialLayers$ = new BehaviorSubject<TileLayer[]>(this.aerialLayers);

  constructor() {}

  createMap(
    id: string,
    layers: BaseLayer[] | Collection<BaseLayer> | LayerGroup,
    view: View,
    controls?: Collection<Control> | Control[]
  ): Observable<any> {
    this._map = new Map({
      target: id,
      layers,
      view,
      controls,
    });
    this.map$.next(this._map);
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
    this.drawLayers.forEach((layer) => (this._map as Map).removeLayer(layer));
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

  addAerialLayer(layer: TileLayer) {
    this.aerialLayers.push(layer);
    this.aerialLayers$.next(this.aerialLayers);
  }

  getAerialLayers() {
    return this.aerialLayers$.asObservable();
  }

  latLonLiteralToLonLat(path: LatLngLiteral[]) {
    const coordsList: Coordinate[] = [];

    if (path !== undefined) {
      path.forEach((coords) => coordsList.push(fromLonLat([coords.lng, coords.lat])));
    }

    return [coordsList];
  }

  coordinateToObject(coordinate: Coordinate): any {
    return { long: coordinate[0], lat: coordinate[1] };
  }

  fourSidePolygonCoordToObject(coordinates: Coordinate[]): any {
    if (coordinates.length === 4) {
      const latSort = coordinates.sort((a, b) => a[1] - b[1]);
      const tops = latSort.slice(2, 4);
      const bottoms = latSort.slice(0, 2);

      let topLeft = tops[0];
      let topRight = tops[1];
      if (tops[0][0] > tops[1][0]) {
        topRight = tops[0];
        topLeft = tops[1];
      }

      let bottomLeft = bottoms[0];
      let bottomRight = bottoms[1];
      if (bottoms[0][0] > bottoms[1][0]) {
        bottomRight = bottoms[0];
        bottomLeft = bottoms[1];
      }

      const coordsDB = {
        topLeft: this.coordinateToObject(topLeft),
        topRight: this.coordinateToObject(topRight),
        bottomRight: this.coordinateToObject(bottomRight),
        bottomLeft: this.coordinateToObject(bottomLeft),
      };

      return coordsDB;
    } else {
      return null;
    }
  }

  coordsDBToCoordinate(coords: any) {
    const coordinates: Coordinate[] = [
      [coords.topLeft.long, coords.topLeft.lat],
      [coords.topRight.long, coords.topRight.lat],
      [coords.bottomRight.long, coords.bottomRight.lat],
      [coords.bottomLeft.long, coords.bottomLeft.lat],
    ];

    return coordinates;
  }

  getCentroid(coords: Coordinate[]): Coordinate {
    let sumLong = 0;
    let sumLat = 0;
    coords.forEach((coord) => {
      sumLong += coord[0];
      sumLat += coord[1];
    });

    return [sumLong / coords.length, sumLat / coords.length];
  }

  resetService() {
    this.map = undefined;
    this.draw = undefined;
    this.drawLayers = [];
    this.thermalLayers = [];
    this.aerialLayers = [];
    this.anomaliaLayers = [];
    this.seguidorLayers = [];
    this.incrementoLayers = [];
  }

  ///////////////////////////////////////////////////////////////////////

  get draw() {
    return this._draw;
  }

  set draw(value: Draw) {
    this._draw = value;
    this.draw$.next(value);
  }

  get map() {
    return this._map;
  }

  set map(value: Map) {
    this._map = value;
    this.map$.next(value);
  }
}