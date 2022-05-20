import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { PlantaService } from './planta.service';
import { InformeService } from './informe.service';
import { FilterService } from '@data/services/filter.service';

import { PlantaInterface } from '@core/models/planta';
import { RawModule } from '@core/models/moduloBruto';
import { FilterModuloBruto } from '@core/models/filterModuloBruto';
import { FilterableElement } from '@core/models/filterableInterface';
import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { Coordinate } from 'ol/coordinate';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { NormalizedModule } from '@core/models/normalizedModule';
import { ModuleGroup } from '@core/models/moduleGroup';

@Injectable({
  providedIn: 'root',
})
export class StructuresService {
  private _informeId: string;
  private _planta: PlantaInterface = {};
  planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  private _thermalLayer: ThermalLayerInterface;

  private _endFilterSubscription = false;
  endFilterSubscription$ = new BehaviorSubject<boolean>(this._endFilterSubscription);

  private _modulesLoaded = false;
  modulesLoaded$ = new BehaviorSubject<boolean>(this._modulesLoaded);

  private _loadRawModules = false;
  loadRawModules$ = new BehaviorSubject<boolean>(this._loadRawModules);
  private _allRawModules: RawModule[] = [];
  allRawModules$ = new BehaviorSubject<RawModule[]>(this._allRawModules);
  private _createRawModMode = false;
  createRawModMode$ = new BehaviorSubject<boolean>(this._createRawModMode);
  private _deleteRawModMode = false;
  deleteRawModMode$ = new BehaviorSubject<boolean>(this._deleteRawModMode);
  private _deletedRawModIds: string[] = [];
  deletedRawModIds$ = new BehaviorSubject<string[]>(this._deletedRawModIds);
  private _reportNumModules: number = 0;

  private _drawModGroups = false;
  drawModGroups$ = new BehaviorSubject<boolean>(this._drawModGroups);
  private _modGroupSelectedId: string = undefined;
  modGroupSelectedId$ = new BehaviorSubject<string>(this._modGroupSelectedId);
  private _allModGroups: ModuleGroup[] = [];
  allModGroups$ = new BehaviorSubject<ModuleGroup[]>(this._allModGroups);

  private _loadNormModules = false;
  loadNormModules$ = new BehaviorSubject<boolean>(this._loadNormModules);
  private _editNormModules = false;
  editNormModules$ = new BehaviorSubject<boolean>(this._editNormModules);
  private _normModSelected: NormalizedModule = undefined;
  normModSelected$ = new BehaviorSubject<NormalizedModule>(this._normModSelected);
  private _allNormModules: NormalizedModule[] = [];
  allNormModules$ = new BehaviorSubject<NormalizedModule[]>(this._allNormModules);

  public areaAverage: number = undefined;
  public areaStdDev: number = undefined;
  public aspectRatioAverage: number = undefined;
  public aspectRatioStdDev: number = undefined;
  public confianzaAverage: number = undefined;
  public confianzaStdDev: number = undefined;

  constructor(
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    public afs: AngularFirestore,
    private filterService: FilterService
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

            return this.informeService.getThermalLayerDB$(this.informeId);
          })
        )
        .subscribe((layers) => {
          this.thermalLayer = layers[0];

          // cargamos las agrupaciones
          this.getModuleGroups()
            .pipe(take(1))
            .subscribe((modGroups) => (this.allModGroups = modGroups));

          // cargamos los modulos normalizados
          this.getNormModules()
            .pipe(take(1))
            .subscribe((normMods) => (this.allNormModules = normMods));

          initService(true);
        });
    });
  }

  setInitialAveragesAndStandardDeviations() {
    const areas = this.allRawModules.map((module) => module.area);
    this.areaAverage = this.average(areas);
    this.areaStdDev = this.standardDeviation(areas);

    const aspectRatios = this.allRawModules.map((module) => module.aspectRatio);
    this.aspectRatioAverage = this.average(aspectRatios);
    this.aspectRatioStdDev = this.standardDeviation(aspectRatios);

    const confianzas = this.allRawModules.map((module) => module.confianza);
    this.confianzaAverage = this.average(confianzas);
    this.confianzaStdDev = this.standardDeviation(confianzas);

    // cargamos los modulos en bruto
    this.loadRawModules = true;
  }

  updateAveragesAndStandardDeviations(modules: RawModule[]) {
    const areas = modules.map((module) => module.area);
    this.areaAverage = this.average(areas);
    this.areaStdDev = this.standardDeviation(areas);

    const aspectRatios = modules.map((module) => module.aspectRatio);
    this.aspectRatioAverage = this.average(aspectRatios);
    this.aspectRatioStdDev = this.standardDeviation(aspectRatios);

    const confianzas = modules.map((module) => module.confianza);
    this.confianzaAverage = this.average(confianzas);
    this.confianzaStdDev = this.standardDeviation(confianzas);
  }

  private average(values: number[]): number {
    const sum = values.reduce((s, value) => s + value, 0);

    const avg = sum / values.length;

    return avg;
  }

  private standardDeviation(values: number[]): number {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b) / n;
    return Math.sqrt(values.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
  }

  private DAM(values: number[], average: number): number {
    // desviacion media absoluta, para que no afectanten los extremos a la desviacion
    let sumatorioDesviaciones = 0;
    values.forEach((value) => {
      sumatorioDesviaciones = sumatorioDesviaciones + Math.abs(value - average);
    });

    return sumatorioDesviaciones / values.length;
  }

  addRawModule(module: RawModule) {
    // obtenemos un ID aleatorio
    const id = this.afs.createId();

    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/modulosEnBruto');

    // lo preparamos para la DB
    module.coords = { ...module.coords };
    module = Object.assign({}, module);

    colRef
      .doc(id)
      .set(module)
      .then(() => {
        console.log('Módulo creado correctamente con ID: ', id);
      })
      .catch((error) => {
        console.error('Error al crear módulo: ', error);
      });
  }

  getModulosBrutos(): Observable<RawModule[]> {
    const query$ = this.afs
      .collection<RawModule>('thermalLayers/' + this.thermalLayer.id + '/modulosEnBruto')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();
            data.id = doc.payload.doc.id;

            // Convertimos el objeto en un array
            data.coords = Object.values(data.coords);

            return data;
          })
        )
      );
    return query$;
  }

  getFiltersParams(): Observable<FilterModuloBruto[]> {
    const query$ = this.afs
      .collection('thermalLayers/' + this.thermalLayer.id + '/filters')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();

            return data;
          })
        )
      );
    return query$;
  }

  getModuleGroups() {
    const query$ = this.afs
      .collection<ModuleGroup>('thermalLayers/' + this.thermalLayer.id + '/agrupaciones')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();
            const id = doc.payload.doc.id;

            // Convertimos el objeto en un array
            data.coords = Object.values(data.coords);

            return { id, ...data };
          })
        )
      );
    return query$;
  }

  addFilter(filterType: string, value: any) {
    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/filters');

    colRef
      .doc('filter')
      .get()
      .toPromise()
      .then((data) => {
        // comprovamos primero que exista la entrada en DB
        if (data.exists) {
          colRef
            .doc('filter')
            .update({
              [filterType]: value,
            })
            .then(() => {
              console.log('Filtro actualizado correctamente');
            })
            .catch((error) => {
              console.error('Error al actualizar filtro: ', error);
            });
        } else {
          colRef
            .doc('filter')
            .set({
              [filterType]: value,
            })
            .then(() => {
              console.log('Filtro creado correctamente');
            })
            .catch((error) => {
              console.error('Error al crear filtro: ', error);
            });
        }
      });
  }

  addModuleGroup(modGroup: ModuleGroup) {
    let id = modGroup.id;

    if (id === undefined) {
      // obtenemos un ID aleatorio
      id = this.afs.createId();
    }

    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/agrupaciones');

    // lo preparamos para la DB
    modGroup.coords = Object.assign({}, modGroup.coords);

    colRef
      .doc(id)
      .set(modGroup)
      .then(() => {
        console.log('Agrupación creada correctamente');
      })
      .catch((error) => {
        console.error('Error al crear agrupacion: ', error);
      });
  }

  deleteModuleGroup(id: string) {
    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/agrupaciones');

    colRef
      .doc(id)
      .delete()
      .then(() => {
        console.log('Agrupación eliminada correctamente');
      })
      .catch((error) => {
        console.error('Error al eliminar agrupacion: ', error);
      });
  }

  getNormModules(thermalLayer?: ThermalLayerInterface): Observable<NormalizedModule[]> {
    if (thermalLayer !== undefined) {
      this.thermalLayer = thermalLayer;
    }
    const query$ = this.afs
      .collection<NormalizedModule>('thermalLayers/' + this.thermalLayer.id + '/modulosNormalizados')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();
            const id = doc.payload.doc.id;

            return { id, ...data };
          })
        )
      );
    return query$;
  }

  addNormModule(module: NormalizedModule) {
    let id = module.id;

    if (id === undefined) {
      // obtenemos un ID aleatorio
      id = this.afs.createId();
    }

    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/modulosNormalizados');

    colRef
      .doc(id)
      .set(module)
      .then(() => {
        console.log('Módulo creado correctamente con ID: ', id);
      })
      .catch((error) => {
        console.error('Error al crear módulo: ', error);
      });
  }

  updateNormModule(module: NormalizedModule) {
    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/modulosNormalizados');

    colRef
      .doc(module.id)
      .update(module)
      .catch((error) => {
        console.error('Error al actualizad módulo: ', error);
      });
  }

  deleteNormModule(id: string) {
    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/modulosNormalizados');

    colRef
      .doc(id)
      .delete()
      .then(() => {
        console.log('Módulo eliminado correctamente');
      })
      .catch((error) => {
        console.error('Error al eliminar módulo: ', error);
      });
  }

  deleteNormModulesByGroup(modGroupId: string) {
    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/modulosNormalizados', (ref) =>
      ref.where('agrupacionId', '==', modGroupId)
    );

    colRef.get().forEach((docs) => docs.forEach((doc) => doc.ref.delete()));
  }

  deleteFilter(filterType: string) {
    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/filters');
    colRef.doc('filter').update({
      [filterType]: firebase.firestore.FieldValue.delete(),
    });
  }

  applyFilters(filters: FilterModuloBruto[]) {
    const filter = filters[0];
    if (filter.confianzaM !== undefined) {
      const confianzaFilter = new ModuloBrutoFilter('confianzaM', filter.confianzaM.min, filter.confianzaM.max);
      this.filterService.addFilter(confianzaFilter);
    }
    if (filter.aspectRatioM !== undefined) {
      const aspectRatioFilter = new ModuloBrutoFilter('aspectRatioM', filter.aspectRatioM.min, filter.aspectRatioM.max);
      this.filterService.addFilter(aspectRatioFilter);
    }
    if (filter.areaM !== undefined) {
      // usamos 'areaM' para diferenciarlo del filtro 'area' de anomalias y seguidores
      const areaFilter = new ModuloBrutoFilter('areaM', filter.areaM.min, filter.areaM.max);
      this.filterService.addFilter(areaFilter);
    }
  }

  generateRandomId(): string {
    // obtenemos un ID aleatorio
    return this.afs.createId();
  }

  getAspectRatio(coords: Coordinate[][]) {
    const topLeft = coords[0][3];
    const topRight = coords[0][2];
    const lineH = new LineString([topLeft, topRight]);

    const bottomLeft = coords[0][0];
    const lineV = new LineString([topLeft, bottomLeft]);

    return lineH.getLength() / lineV.getLength();
  }

  getArea(coords: Coordinate[][]) {
    const topLeft = coords[0][3];
    const topRight = coords[0][2];
    const lineH = new LineString([topLeft, topRight]);

    const bottomLeft = coords[0][0];
    const lineV = new LineString([topLeft, bottomLeft]);

    return lineH.getLength() * lineV.getLength();
  }

  public coordsDBToCoordinate(coords: any) {
    const coordinates: Coordinate[] = [
      [coords.topLeft.long, coords.topLeft.lat],
      [coords.topRight.long, coords.topRight.lat],
      [coords.bottomRight.long, coords.bottomRight.lat],
      [coords.bottomLeft.long, coords.bottomLeft.lat],
    ];

    return coordinates;
  }

  public coordinateToObject(coordinates: Coordinate[][]) {
    let top = -9000000;
    let right = -9000000;
    coordinates[0].forEach((corner) => {
      if (corner[1] > top) {
        top = corner[1];
      }
      if (corner[0] > right) {
        right = corner[0];
      }
    });
    let bottom;
    let left;
    coordinates[0].forEach((corner) => {
      if (corner[1] < top) {
        bottom = corner[1];
      }
      if (corner[0] < right) {
        left = corner[0];
      }
    });
    const coords = {
      topLeft: {
        lat: top,
        long: left,
      },
      topRight: {
        lat: top,
        long: right,
      },
      bottomRight: {
        lat: bottom,
        long: right,
      },
      bottomLeft: {
        lat: bottom,
        long: left,
      },
    };

    return coords;
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

  getMedian(values: number[]) {
    values.sort((a, b) => {
      return a - b;
    });
    const mid = values.length / 2;
    return mid % 1 ? values[mid - 0.5] : (values[mid - 1] + values[mid]) / 2;
  }

  prepareCentroidToDB(centroid: Coordinate) {
    const centroidD = {
      lat: centroid[1],
      long: centroid[0],
    };

    return centroidD;
  }

  resetService() {
    this.endFilterSubscription = false;

    this.modulesLoaded = false;
    this.loadRawModules = false;
    this.allRawModules = [];
    this.createRawModMode = false;
    this.deleteRawModMode = false;
    this.deletedRawModIds = [];

    this.reportNumModules = 0;

    this.drawModGroups = false;
    this.modGroupSelectedId = undefined;
    this.allModGroups = [];

    this.loadNormModules = false;
    this.editNormModules = false;
    this.normModSelected = undefined;
    this.allNormModules = [];

    // this.thermalLayer = undefined;

    this.areaAverage = undefined;
    this.areaStdDev = undefined;
    this.aspectRatioAverage = undefined;
    this.aspectRatioStdDev = undefined;
    this.confianzaAverage = undefined;
    this.confianzaStdDev = undefined;
  }

  ////////////////////////////////////////////////

  get modulesLoaded() {
    return this._modulesLoaded;
  }

  set modulesLoaded(value: boolean) {
    this._modulesLoaded = value;
    this.modulesLoaded$.next(value);
  }

  get planta() {
    return this._planta;
  }

  set planta(value: PlantaInterface) {
    this._planta = value;
    this.planta$.next(value);
  }

  get informeId() {
    return this._informeId;
  }

  set informeId(value: string) {
    this._informeId = value;
  }

  get thermalLayer() {
    return this._thermalLayer;
  }

  set thermalLayer(value: ThermalLayerInterface) {
    this._thermalLayer = value;
  }

  /* RAW MODULES */

  get endFilterSubscription() {
    return this._endFilterSubscription;
  }

  set endFilterSubscription(value: boolean) {
    this._endFilterSubscription = value;
    this.endFilterSubscription$.next(value);
  }

  get createRawModMode() {
    return this._createRawModMode;
  }

  set createRawModMode(value: boolean) {
    this._createRawModMode = value;
    this.createRawModMode$.next(value);
  }

  get deleteRawModMode() {
    return this._deleteRawModMode;
  }

  set deleteRawModMode(value: boolean) {
    this._deleteRawModMode = value;
    this.deleteRawModMode$.next(value);
  }

  get allRawModules() {
    return this._allRawModules;
  }

  set allRawModules(value: RawModule[]) {
    this._allRawModules = value;
    this.allRawModules$.next(value);
  }

  get loadRawModules() {
    return this._loadRawModules;
  }

  set loadRawModules(value: boolean) {
    this._loadRawModules = value;
    this.loadRawModules$.next(value);
  }

  get deletedRawModIds() {
    return this._deletedRawModIds;
  }

  set deletedRawModIds(value: string[]) {
    this._deletedRawModIds = value;
    this.deletedRawModIds$.next(value);
  }

  /* MODULE GROUPS */

  get drawModGroups() {
    return this._drawModGroups;
  }

  set drawModGroups(value: boolean) {
    this._drawModGroups = value;
    this.drawModGroups$.next(value);
  }

  get modGroupSelectedId() {
    return this._modGroupSelectedId;
  }

  set modGroupSelectedId(value: string) {
    this._modGroupSelectedId = value;
    this.modGroupSelectedId$.next(value);
  }

  get allModGroups() {
    return this._allModGroups;
  }

  set allModGroups(value: ModuleGroup[]) {
    this._allModGroups = value;
    this.allModGroups$.next(value);
  }

  /* NORMALIZED MODULES */

  get loadNormModules() {
    return this._loadNormModules;
  }

  set loadNormModules(value: boolean) {
    this._loadNormModules = value;
    this.loadNormModules$.next(value);
  }

  get editNormModules() {
    return this._editNormModules;
  }

  set editNormModules(value: boolean) {
    this._editNormModules = value;
    this.editNormModules$.next(value);
  }

  get normModSelected() {
    return this._normModSelected;
  }

  set normModSelected(value: NormalizedModule) {
    this._normModSelected = value;
    this.normModSelected$.next(value);
  }

  get allNormModules() {
    return this._allNormModules;
  }

  set allNormModules(value: NormalizedModule[]) {
    this._allNormModules = value;
    this.allNormModules$.next(value);
  }

  //////////////////////////////

  get reportNumModules() {
    return this._reportNumModules;
  }

  set reportNumModules(value: number) {
    this._reportNumModules = value;
  }
}