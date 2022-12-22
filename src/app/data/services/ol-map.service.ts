import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

import { LatLngLiteral } from '@agm/core';

import proj4 from 'proj4';

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
import XYZ from 'ol/source/XYZ';

import { ThermalService } from '@data/services/thermal.service';

import { InformeInterface } from '@core/models/informe';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { GeoserverService } from './geoserver.service';

import { GEO } from '@data/constants/geo';

import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';
import ImageTileMod from '@shared/modules/ol-maps/ImageTileMod.js';
import ImageTileCubiertasMod from '@shared/modules/ol-maps/ImageTileCubiertasMod.js';
import VectorImageLayer from 'ol/layer/VectorImage';

@Injectable({
  providedIn: 'root',
})
export class OlMapService {
  private _map = undefined;
  public map$ = new BehaviorSubject<any>(this._map);
  private _currentZoom = 17;
  currentZoom$ = new BehaviorSubject<number>(this._currentZoom);
  private _draw: Draw = undefined;
  public draw$ = new BehaviorSubject<Draw>(this._draw);
  private drawLayers: VectorLayer[] = [];
  private thermalLayers: TileLayer[] = [];
  private thermalLayers$ = new BehaviorSubject<TileLayer[]>(this.thermalLayers);
  private anomaliaLayers: VectorImageLayer[] = [];
  private anomaliaLayers$ = new BehaviorSubject<VectorImageLayer[]>(this.anomaliaLayers);
  private seguidorLayers: VectorLayer[] = [];
  private seguidorLayers$ = new BehaviorSubject<VectorLayer[]>(this.seguidorLayers);
  private _zonasLayers: VectorLayer[] = [];
  zonasLayers$ = new BehaviorSubject<VectorLayer[]>(this._zonasLayers);
  private incrementoLayers: VectorLayer[] = [];
  private incrementoLayers$ = new BehaviorSubject<VectorLayer[]>(this.incrementoLayers);
  private _aerialLayers: TileLayer[] = [];
  aerialLayers$ = new BehaviorSubject<TileLayer[]>(this._aerialLayers);
  mapMoving = false;

  constructor(
    private http: HttpClient,
    private thermalService: ThermalService,
    private geoserverService: GeoserverService
  ) {}

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

  addMoveStartEvent() {
    this.map.on('movestart', () => (this.mapMoving = true));
  }

  addMoveEndEvent() {
    this.map.on('moveend', () => (this.mapMoving = false));
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

  addAnomaliaLayer(layer: VectorImageLayer) {
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

  addZoneLayer(layer: VectorLayer) {
    this._zonasLayers.push(layer);
    this.zonasLayers$.next(this._zonasLayers);
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

  addAerialLayer(informe: InformeInterface): Promise<void> {
    const url: string = this.geoserverService.getGeoserverUrl(informe, 'visual');
    const urlCheck: string = this.geoserverService.getGeoserverUrl(informe, 'visual', true);

    return new Promise((resolve, reject) => {
      this.http
        .get(urlCheck)
        .pipe(
          take(1),
          catchError((error) => {
            let aerialLayer: TileLayer;

            // no recibimos respuesta del servidor porque no existe
            if (error.status === 0 || error.status === 504) {
              aerialLayer = new TileLayer({});
              aerialLayer.setProperties({
                informeId: informe.id,
                exist: false,
              });
            } else {
              // si recibimos respuesta del servidor, es que existe la capa
              const aerial = new XYZ({
                url,
                crossOrigin: null,
              });

              aerialLayer = new TileLayer({
                source: aerial,
                preload: Infinity,
              });

              aerialLayer.setProperties({
                informeId: informe.id,
                exist: true,
              });
            }
            this._aerialLayers.push(aerialLayer);
            this.aerialLayers$.next(this._aerialLayers);

            resolve();

            return [];
          }),
          take(1)
        )
        .subscribe(() => {});
    });
  }

  createThermalLayer(thermalLayer: ThermalLayerInterface, informe: InformeInterface, index: number): TileLayer {
    // Iniciar mapa térmico
    let url: string;
    if (informe.hasOwnProperty('servidorCapas')) {
      switch (informe.servidorCapas) {
        case 'geoserver': {
          url = GEO.urlGeoserver + thermalLayer.gisName + '@WebMercatorQuad@png/{z}/{x}/{y}.png?flipY=true';
          break;
        }
        case 'old': {
          url = GEO.urlServidorAntiguo + thermalLayer.gisName + '/{z}/{x}/{y}.png';
          break;
        }
      }
    } else {
      url = GEO.urlServidorAntiguo + thermalLayer.gisName + '/{z}/{x}/{y}.png';
    }

    let tileClass = ImageTileMod;
    if (GEO.plantasTipoCubiertas.includes(informe.plantaId)) {
      tileClass = ImageTileCubiertasMod;
    }

    const tl = new TileLayer({
      source: new XYZ_mod({
        url,
        crossOrigin: 'anonymous',
        tileClass,
        tileLoadFunction: (imageTile, src) => {
          imageTile.rangeTempMax = thermalLayer.rangeTempMax;
          imageTile.rangeTempMin = thermalLayer.rangeTempMin;
          imageTile.thermalService = this.thermalService;
          imageTile.getImage().src = src;
          imageTile.thermalLayer = thermalLayer;
          imageTile.index = index;
        },
      }),
      preload: Infinity,
    });

    return tl;
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

  pathToCoordinate(path: LatLngLiteral[]): Coordinate[] {
    const coordenadas: Coordinate[] = [];
    path.forEach((coord) => {
      const coordenada: Coordinate = fromLonLat([coord.lng, coord.lat]);
      coordenadas.push(coordenada);
    });
    return coordenadas;
  }

  turfCoordinateToPath(coordinates: Coordinate[][]): LatLngLiteral[] {
    const path: LatLngLiteral[] = [];
    coordinates[0].forEach((coord, index, coords) => {
      const coordConverted = proj4('EPSG:3857', 'EPSG:4326', coord);

      // quitamos el ultimo xq es igual al primero
      if (index < coords.length - 1) {
        const latLng: LatLngLiteral = { lng: coordConverted[0], lat: coordConverted[1] };
        path.push(latLng);
      }
    });
    return path;
  }

  setViewCenter(center: Coordinate) {
    this.map.getView().setCenter(center);
  }

  setViewZoom(zoom: number) {
    this.map.getView().setZoom(zoom);
  }

  resetService() {
    this.map = undefined;
    this.draw = undefined;
    this.drawLayers = [];
    this.thermalLayers = [];
    this.aerialLayers = [];
    this.anomaliaLayers = [];
    this.seguidorLayers = [];
    this.zonasLayers = [];
    this.incrementoLayers = [];
    this.currentZoom = 17;
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

  get currentZoom(): number {
    return this._currentZoom;
  }

  set currentZoom(value: number) {
    this._currentZoom = value;
    this.currentZoom$.next(value);
  }

  get zonasLayers(): VectorLayer[] {
    return this._zonasLayers;
  }

  set zonasLayers(value: VectorLayer[]) {
    this._zonasLayers = value;
    this.zonasLayers$.next(value);
  }

  get aerialLayers(): TileLayer[] {
    return this._aerialLayers;
  }

  set aerialLayers(value: TileLayer[]) {
    this._aerialLayers = value;
    this.aerialLayers$.next(value);
  }
}
