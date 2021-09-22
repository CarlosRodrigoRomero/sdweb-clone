import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFirestore } from '@angular/fire/firestore';

import { BehaviorSubject, Observable } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';

import { Feature, Map } from 'ol';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';

import { InformeService } from './informe.service';
import { PlantaService } from './planta.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { OlMapService } from '@core/services/ol-map.service';
import { StructuresService } from '@core/services/structures.service';

import { PlantaInterface } from '@core/models/planta';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';
import { ModuloInterface } from '@core/models/modulo';

@Injectable({
  providedIn: 'root',
})
export class ClassificationService {
  private _informeId: string;
  private _planta: PlantaInterface = {};
  planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  private _thermalLayer: ThermalLayerInterface;
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private map: Map;
  private _normModSelected: NormalizedModule = undefined;
  normModSelected$ = new BehaviorSubject<NormalizedModule>(this._normModSelected);
  private _normModHovered: NormalizedModule = undefined;
  normModHovered$ = new BehaviorSubject<NormalizedModule>(this._normModHovered);
  private _normModAnomaliaSelected: NormalizedModule = undefined;
  normModAnomaliaSelected$ = new BehaviorSubject<NormalizedModule>(this._normModAnomaliaSelected);
  private _anomaliaSelected: Anomalia = undefined;
  anomaliaSelected$ = new BehaviorSubject<Anomalia>(this._anomaliaSelected);
  private _listaAnomalias: Anomalia[] = undefined;
  listaAnomalias$ = new BehaviorSubject<Anomalia[]>(this._listaAnomalias);
  private _locAreasWithModule: LocationAreaInterface[] = undefined;
  locAreasWithModule$ = new BehaviorSubject<LocationAreaInterface[]>(this._locAreasWithModule);
  private _normModules: NormalizedModule[] = [];
  normModules$ = new BehaviorSubject<NormalizedModule[]>(this._normModules);

  constructor(
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private anomaliaService: AnomaliaService,
    private afs: AngularFirestore,
    private olMapService: OlMapService,
    private structuresService: StructuresService
  ) {}

  initService(): Promise<boolean> {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    return new Promise((initService) => {
      this.informeService
        .getInforme(this.informeId)
        .pipe(
          take(1),
          switchMap((informe) => this.plantaService.getPlanta(informe.plantaId))
        )
        .pipe(
          take(1),
          switchMap((planta) => {
            this.planta = planta;

            this.getLocAreasWithModules();

            return this.informeService.getThermalLayerDB$(this.informeId);
          }),
          take(1),
          switchMap((layers) => {
            // comprobamos si existe la thermalLayer
            if (layers.length > 0) {
              this.thermalLayer = layers[0];
            }

            // obtenemos los modulos normalizados
            return this.structuresService.getNormModules(this.thermalLayer);
          })
        )
        .pipe(take(1))
        .subscribe((normMods) => {
          this.normModules = normMods;

          // preparamos las locAreas para luego calcular las globalCoords de las nuevas anomalias
          this.plantaService.setLocAreaListFromPlantaIdOl(this.planta.id);

          initService(true);
        });

      // nos subscribimos a la lista de anomalias
      this.anomaliaService.getAnomaliasInforme$(this.informeId).subscribe((anoms) => (this.listaAnomalias = anoms));

      this.olMapService.map$.subscribe((map) => (this.map = map));
    });
  }

  createAnomaliaFromNormModule(feature: Feature, date: number) {
    const id = feature.getProperties().properties.id;
    const refAnom = this.afs.collection('anomalias').doc(id);
    const normModule: NormalizedModule = feature.getProperties().properties.normMod;
    const geometry = feature.getGeometry() as SimpleGeometry;

    let coords: Coordinate;
    // si existe centroId lo usamos, sino usamos un vertice del rectangulo
    if (normModule.hasOwnProperty('centroid_gps')) {
      coords = [normModule.centroid_gps.long, normModule.centroid_gps.lat] as Coordinate;
    } else {
      coords = this.plantaService.getGlobalCoordsFromLocationAreaOl(geometry.getCoordinates()[0][0]);
    }

    refAnom
      .get()
      .toPromise()
      .then((anom) => {
        // comprobamos si la anomalia existe
        if (anom.exists) {
          // si existe la traemos para leer sus datos
          this.anomaliaService.getAnomalia(id).subscribe((anomalia) => (this.anomaliaSelected = anomalia));
        } else {
          // si no existe previmente la creamos
          const globalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(coords);
          const modulo = this.getAnomModule(geometry.getCoordinates()[0][0]);

          const anomalia: Anomalia = {
            id,
            plantaId: this.planta.id,
            informeId: this.informeId,
            tipo: 8,
            globalCoords,
            gradienteNormalizado: 0,
            temperaturaMax: 0,
            modulo,
            featureCoords: geometry.getCoordinates()[0],
            featureType: geometry.getType(),
            localX: normModule.columna,
            localY: normModule.fila,
            datetime: date,
          };
          // asignamos la nueva anomalia para acceder a ella y poder modificarla
          this.anomaliaSelected = anomalia;

          this.listaAnomalias.push(anomalia);

          // Guardar en la base de datos
          this.anomaliaService.addAnomalia(anomalia);
        }
      });
  }

  hidePopup() {
    this.map.getOverlayById('popup').setPosition(undefined);
  }

  private getLocAreasWithModules() {
    this.plantaService
      .getLocationsArea(this.planta.id)
      .pipe(take(1))
      .subscribe((locAreas) => (this.locAreasWithModule = locAreas.filter((locArea) => locArea.modulo !== undefined)));
  }

  getAnomModule(coords: Coordinate): ModuloInterface {
    let modulo: ModuloInterface;

    if (this.locAreasWithModule.length === 1) {
      modulo = this.locAreasWithModule[0].modulo;
    } else {
      this.locAreasWithModule.forEach((locArea) => {
        const polygon = new Polygon(this.olMapService.latLonLiteralToLonLat((locArea as any).path));

        if (polygon.intersectsCoordinate(coords)) {
          modulo = locArea.modulo;
        }
      });
    }
    if (modulo === undefined) {
      modulo = null;
    }

    return modulo;
  }

  ////////////////////////////////////////////////////////////

  get informeId() {
    return this._informeId;
  }

  set informeId(value: string) {
    this._informeId = value;
  }

  get planta() {
    return this._planta;
  }

  set planta(value: PlantaInterface) {
    this._planta = value;
    this.planta$.next(value);
  }

  get thermalLayer() {
    return this._thermalLayer;
  }

  set thermalLayer(value: ThermalLayerInterface) {
    this._thermalLayer = value;
  }

  get normModSelected() {
    return this._normModSelected;
  }

  set normModSelected(value: NormalizedModule) {
    this._normModSelected = value;
    this.normModSelected$.next(value);
  }

  get anomaliaSelected() {
    return this._anomaliaSelected;
  }

  set anomaliaSelected(value: Anomalia) {
    this._anomaliaSelected = value;
    this.anomaliaSelected$.next(value);
  }

  get normModHovered() {
    return this._normModHovered;
  }

  set normModHovered(value: NormalizedModule) {
    this._normModHovered = value;
    this.normModHovered$.next(value);
  }

  get normModAnomaliaSelected() {
    return this._normModAnomaliaSelected;
  }

  set normModAnomaliaSelected(value: NormalizedModule) {
    this._normModAnomaliaSelected = value;
    this.normModAnomaliaSelected$.next(value);
  }

  get listaAnomalias() {
    return this._listaAnomalias;
  }

  set listaAnomalias(value: Anomalia[]) {
    this._listaAnomalias = value;
    this.listaAnomalias$.next(value);
  }

  get locAreasWithModule() {
    return this._locAreasWithModule;
  }

  set locAreasWithModule(value: LocationAreaInterface[]) {
    this._locAreasWithModule = value;
    this.locAreasWithModule$.next(value);
  }

  get normModules() {
    return this._normModules;
  }

  set normModules(value: NormalizedModule[]) {
    this._normModules = value;
    this.normModules$.next(value);
  }
}
