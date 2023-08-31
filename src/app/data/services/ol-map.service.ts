import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, of } from 'rxjs';
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
import VectorImageLayer from 'ol/layer/VectorImage';

import { ThermalService } from '@data/services/thermal.service';

import { InformeInterface } from '@core/models/informe';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { GeoserverService } from './geoserver.service';

import { GEO } from '@data/constants/geo';

import XYZ_mod from '@shared/modules/ol-maps/xyz_mod.js';
import ImageTileMod from '@shared/modules/ol-maps/ImageTileMod.js';
import ImageTileCubiertasMod from '@shared/modules/ol-maps/ImageTileCubiertasMod.js';
import { OSM } from 'ol/source';

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
  private drawLayers: VectorLayer<any>[] = [];
  private _thermalLayers: TileLayer<any>[] = [];
  thermalLayers$ = new BehaviorSubject<TileLayer<any>[]>(this._thermalLayers);
  private anomaliaLayers: VectorImageLayer<any>[] = [];
  private anomaliaLayers$ = new BehaviorSubject<VectorImageLayer<any>[]>(this.anomaliaLayers);
  private seguidorLayers: VectorImageLayer<any>[] = [];
  private seguidorLayers$ = new BehaviorSubject<VectorImageLayer<any>[]>(this.seguidorLayers);
  private _zonasLayers: VectorImageLayer<any>[] = [];
  zonasLayers$ = new BehaviorSubject<VectorImageLayer<any>[]>(this._zonasLayers);
  private incrementoLayers: VectorLayer<any>[] = [];
  private incrementoLayers$ = new BehaviorSubject<VectorLayer<any>[]>(this.incrementoLayers);
  private _aerialLayers: TileLayer<any>[] = [];
  aerialLayers$ = new BehaviorSubject<TileLayer<any>[]>(this._aerialLayers);
  mapMoving = false;
  private _satelliteLayer: TileLayer<any> = undefined;
  satelliteLayer$ = new BehaviorSubject<TileLayer<any>>(this._satelliteLayer);
  private _osmLayer: TileLayer<any> = undefined;
  osmLayer$ = new BehaviorSubject<TileLayer<any>>(this._osmLayer);

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

  createVectorLayer(source: VectorSource<any>): VectorLayer<any> {
    const layer = new VectorLayer({ source });
    this.drawLayers.push(layer);

    return layer;
  }

  addThermalLayer(layer: TileLayer<any>) {
    this.thermalLayers = [...this.thermalLayers, layer];
  }

  getThermalLayers() {
    return this.thermalLayers$.asObservable();
  }

  addAnomaliaLayer(layer: VectorImageLayer<any>) {
    this.anomaliaLayers.push(layer);
    this.anomaliaLayers$.next(this.anomaliaLayers);
  }

  getAnomaliaLayers() {
    return this.anomaliaLayers$.asObservable();
  }

  deleteAllDrawLayers() {
    this.drawLayers.forEach((layer) => (this._map as Map).removeLayer(layer));
  }

  addSeguidorLayer(layer: VectorImageLayer<any>) {
    this.seguidorLayers.push(layer);
    this.seguidorLayers$.next(this.seguidorLayers);
  }

  addZoneLayer(layer: VectorImageLayer<any>) {
    this._zonasLayers.push(layer);
    this.zonasLayers$.next(this._zonasLayers);
  }

  getSeguidorLayers() {
    return this.seguidorLayers$.asObservable();
  }

  addIncrementoLayer(layer: VectorLayer<any>) {
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
            let aerialLayer: TileLayer<any>;

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

  createThermalLayer(
    thermalLayer: ThermalLayerInterface,
    informe: InformeInterface,
    index: number,
    visible = false
  ): TileLayer<any> {
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
      visible,
    });

    return tl;
  }

  createThermalLayerClippings(thermalLayer: ThermalLayerInterface, index: number): TileLayer<any> {
    // Iniciar mapa térmico
    const url = GEO.urlServidorAntiguo + thermalLayer.gisName + '/{z}/{x}/{y}.png';

    const tl = new TileLayer({
      source: new XYZ_mod({
        url,
        crossOrigin: 'anonymous',
        ImageTileMod,
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

  addSatelliteLayer() {
    const satelliteSource = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
      maxZoom: 20,
    });

    // la añadimos oculta por defecto
    this.satelliteLayer = new TileLayer({
      source: satelliteSource,
      preload: Infinity,
      visible: false,
    });
  }

  addOSMLayer() {
    this.osmLayer = new TileLayer({
      source: new OSM(),
      preload: Infinity,
    });
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

  refreshLayersView(informeId: string, view: string) {
    if (this.map !== undefined) {
      this.map
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (layer.getProperties().informeId === informeId && layer.getProperties().view === view) {
            (layer as VectorImageLayer<any>).getSource().changed();
          }
        });
    }
  }

  async checkVisualLayer(informe: InformeInterface): Promise<boolean> {
    const url = this.geoserverService.getGeoserverUrl(informe, 'visual', true);

    try {
      await this.http.get(url).pipe(take(1)).toPromise();
      return true;
    } catch (error) {
      if (error.status === 0 || error.status === 504 || error.status === 400) {
        return false;
      } else {
        return true;
      }
    }
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

  get zonasLayers(): VectorImageLayer<any>[] {
    return this._zonasLayers;
  }

  set zonasLayers(value: VectorImageLayer<any>[]) {
    this._zonasLayers = value;
    this.zonasLayers$.next(value);
  }

  get aerialLayers(): TileLayer<any>[] {
    return this._aerialLayers;
  }

  set aerialLayers(value: TileLayer<any>[]) {
    this._aerialLayers = value;
    this.aerialLayers$.next(value);
  }

  get thermalLayers(): TileLayer<any>[] {
    return this._thermalLayers;
  }

  set thermalLayers(value: TileLayer<any>[]) {
    this._thermalLayers = value;
    this.thermalLayers$.next(value);
  }

  get satelliteLayer(): TileLayer<any> {
    return this._satelliteLayer;
  }

  set satelliteLayer(value: TileLayer<any>) {
    this._satelliteLayer = value;
    this.satelliteLayer$.next(value);
  }

  get osmLayer(): TileLayer<any> {
    return this._osmLayer;
  }

  set osmLayer(value: TileLayer<any>) {
    this._osmLayer = value;
    this.osmLayer$.next(value);
  }
}
