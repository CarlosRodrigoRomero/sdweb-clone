import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { PlantaService } from './planta.service';
import { InformeService } from './informe.service';
import { FilterService } from '@core/services/filter.service';

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

@Injectable({
  providedIn: 'root',
})
export class StructuresService {
  private _informeId: string;
  private _planta: PlantaInterface = {};
  planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _deleteMode = false;
  public deleteMode$ = new BehaviorSubject<boolean>(this._deleteMode);
  private _thermalLayer: ThermalLayerInterface;
  private _deletedRawModIds: string[] = [];
  public deletedRawModIds$ = new BehaviorSubject<string[]>(this._deletedRawModIds);
  private _loadRawModules = false;
  public loadRawModules$ = new BehaviorSubject<boolean>(this._loadRawModules);
  private _loadModuleGroups = false;
  public loadModuleGroups$ = new BehaviorSubject<boolean>(this._loadModuleGroups);
  private _loadNormModules = false;
  public loadNormModules$ = new BehaviorSubject<boolean>(this._loadNormModules);
  private _editNormModules = false;
  public editNormModules$ = new BehaviorSubject<boolean>(this._editNormModules);
  private _allRawModules: RawModule[] = [];
  public allRawModules$ = new BehaviorSubject<RawModule[]>(this._allRawModules);
  public areaAverage: number = undefined;
  public areaStdDev: number = undefined;
  public aspectRatioAverage: number = undefined;
  public aspectRatioStdDev: number = undefined;
  public confianzaAverage: number = undefined;
  public confianzaStdDev: number = undefined;
  private _normModSelected: NormalizedModule = undefined;
  normModSelected$ = new BehaviorSubject<NormalizedModule>(this._normModSelected);

  constructor(
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    public afs: AngularFirestore,
    private filterService: FilterService
  ) {}

  initService(): Observable<boolean> {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

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

        this.initialized$.next(true);
      });
    return this.initialized$;
  }

  public setAveragesAndStandardDeviations() {
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

  private average(values) {
    const sum = values.reduce((s, value) => s + value, 0);

    const avg = sum / values.length;

    return avg;
  }

  private standardDeviation(values) {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b) / n;
    return Math.sqrt(values.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
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
      .collection<any>('thermalLayers/' + this.thermalLayer.id + '/agrupaciones')
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

  addModuleGroup(coords: any) {
    // obtenemos un ID aleatorio
    const id = this.afs.createId();

    const colRef = this.afs.collection('thermalLayers/' + this.thermalLayer.id + '/agrupaciones');

    // lo preparamos para la DB
    coords = Object.assign({}, coords);

    colRef
      .doc(id)
      .set({
        coords,
      })
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

  addNormModule(module: NormalizedModule) {
    // obtenemos un ID aleatorio
    const id = this.afs.createId();

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

  public objectToCoordinate(coords: any) {
    const coordinates: Coordinate[] = [
      [coords.topLeft.long, coords.topLeft.lat],
      [coords.topRight.long, coords.topRight.lat],
      [coords.bottomRight.long, coords.bottomRight.lat],
      [coords.bottomLeft.long, coords.bottomLeft.lat],
    ];

    return coordinates;
  }

  public coordinateToObject(coordinates: Coordinate[][]) {
    const coords = {
      topLeft: {
        lat: coordinates[0][3][1],
        long: coordinates[0][3][0],
      },
      topRight: {
        lat: coordinates[0][2][1],
        long: coordinates[0][2][0],
      },
      bottomRight: {
        lat: coordinates[0][1][1],
        long: coordinates[0][1][0],
      },
      bottomLeft: {
        lat: coordinates[0][0][1],
        long: coordinates[0][0][0],
      },
    };

    return coords;
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

  get deleteMode() {
    return this._deleteMode;
  }

  set deleteMode(value: boolean) {
    this._deleteMode = value;
    this.deleteMode$.next(value);
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

  get loadModuleGroups() {
    return this._loadModuleGroups;
  }

  set loadModuleGroups(value: boolean) {
    this._loadModuleGroups = value;
    this.loadModuleGroups$.next(value);
  }

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

  get deletedRawModIds() {
    return this._deletedRawModIds;
  }

  set deletedRawModIds(value: string[]) {
    this._deletedRawModIds = value;
    this.deletedRawModIds$.next(value);
  }

  get normModSelected() {
    return this._normModSelected;
  }

  set normModSelected(value: NormalizedModule) {
    this._normModSelected = value;
    this.normModSelected$.next(value);
  }
}
