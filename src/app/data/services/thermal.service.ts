import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subscription, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { Anomalia } from '@core/models/anomalia';

import { Patches } from '@core/classes/patches';
import { MathOperations } from '@core/classes/math-operations';
import { THERMAL } from '@data/constants/thermal';

@Injectable({
  providedIn: 'root',
})
export class ThermalService {
  private _thermalLayersDB: ThermalLayerInterface[] = [];
  thermalLayersDB$ = new BehaviorSubject<ThermalLayerInterface[]>(this._thermalLayersDB);

  private _sliderMin: number[] = [];
  sliderMin$ = new BehaviorSubject<number[]>(this._sliderMin);

  private _sliderMax: number[] = [];
  sliderMax$ = new BehaviorSubject<number[]>(this._sliderMax);

  private _indexSelected: number = undefined;
  indexSelected$ = new BehaviorSubject<number>(this._indexSelected);

  private _thermalLayersLoaded: boolean = false;
  thermalLayersLoaded$ = new BehaviorSubject<boolean>(this._thermalLayersLoaded);

  private _paletteSelected: string = 'grayscale';
  paletteSelected$ = new BehaviorSubject<string>(this._paletteSelected);

  private subscriptions: Subscription = new Subscription();

  constructor(private afs: AngularFirestore) {}

  addThermalLayer(thermalLayer: ThermalLayerInterface) {
    this.afs
      .collection('thermalLayers')
      .doc(thermalLayer.id)
      .set(thermalLayer)
      .then((docRef) => {
        console.log('ThermalLayer creada correctamente');
      })
      .catch((error) => {
        console.error('Error creando thermalLayer: ', error);
      });
  }

  getReportThermalLayerDB(informeId: string): Observable<ThermalLayerInterface[]> {
    const query$ = this.afs
      .collection<ThermalLayerInterface>('thermalLayers', (ref) => ref.where('informeId', '==', informeId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data() as ThermalLayerInterface;
            data.id = doc.payload.doc.id;

            return data;
          })
        )
      );
    return query$;
  }

  getPlantThermalLayerDB(plantaId: string, informesId: string[]): Observable<ThermalLayerInterface[]> {
    const query$ = this.afs
      .collection<ThermalLayerInterface>('thermalLayers', (ref) => ref.where('plantaId', '==', plantaId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data() as ThermalLayerInterface;
            data.id = doc.payload.doc.id;

            return data;
          })
        ),
        map((tLs) =>
          tLs
            .filter((tL) => informesId.includes(tL.informeId))
            .sort((a, b) => informesId.indexOf(a.informeId) - informesId.indexOf(b.informeId))
        )
      );
    return query$;
  }

  getThermalLayers(): Observable<ThermalLayerInterface[]> {
    this.subscriptions.add(
      this.afs
        .collection('thermalLayers')
        .snapshotChanges()
        .pipe(
          map((actions) => {
            return actions.map((a) => {
              const data = a.payload.doc.data() as ThermalLayerInterface;
              data.id = a.payload.doc.id;
              return { ...data };
            });
          })
        )
        .subscribe((tL) => (this.thermalLayersDB = tL))
    );

    return this.thermalLayersDB$;
  }

  getThermalLayerValues(informeId: string, anomalias: Anomalia[]): Promise<number[]> {
    // Utilizamos el operador switchMap para manejar el observable resultante
    return this.getReportThermalLayerDB(informeId)
      .pipe(
        take(1),
        switchMap((layersDBs) => {
          return of(this.getInitialTempsLayer(informeId, anomalias, layersDBs.flat()[0]));
        })
      )
      .toPromise();
  }

  private getInitialTempsLayer(informeId: string, anoms: Anomalia[], thermalLayerDB: ThermalLayerInterface): number[] {
    const anomsInforme = anoms.filter((anom) => anom.informeId === informeId);
    const tempRefMedia = this.getTempRefMedia(anomsInforme);

    let tempMin = tempRefMedia - THERMAL.rangeMin;
    let tempMax = this.getTempMax(tempRefMedia, informeId, anoms);
    // let tempMax = tempRefMedia + THERMAL.rangeMax;
    if (this.thermalLayersDB) {
      // asignamos los valores de forma automatica
      if (tempMin < thermalLayerDB.rangeTempMin) {
        tempMin = thermalLayerDB.rangeTempMin;
      }

      if (tempMax > thermalLayerDB.rangeTempMax) {
        tempMax = thermalLayerDB.rangeTempMax;
      }
    }

    // aplicamos parches para ciertas plantas
    [tempMin, tempMax] = Patches.thermalTempsPatchs(informeId, tempMin, tempMax);

    return [tempMin, tempMax];
  }

  private getTempRefMedia(anomsInforme: Anomalia[]) {
    const tempRefMedia = Math.round(MathOperations.average(anomsInforme.map((anom) => anom.temperaturaRef)));
    return tempRefMedia;
  }

  private getTempMax(tempRefMedia: number, informeId: string, anoms: Anomalia[]) {
    const tempMax = tempRefMedia + THERMAL.rangeMax;
    const tempMaxAnom = anoms.reduce((maxTemp, anom) => {
      if (anom.informeId === informeId) {
        return Math.max(maxTemp, anom.temperaturaMax);
      }
      return maxTemp;
    }, Number.NEGATIVE_INFINITY);

    return Math.max(tempMax, tempMaxAnom);
  }

  resetService() {
    this.thermalLayersDB = [];
    this.sliderMin = [];
    this.sliderMax = [];

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  get thermalLayersDB() {
    return this._thermalLayersDB;
  }

  set thermalLayersDB(value: ThermalLayerInterface[]) {
    this._thermalLayersDB = value;
    this.thermalLayersDB$.next(value);
  }

  get sliderMin() {
    return this._sliderMin;
  }

  set sliderMin(value: number[]) {
    this._sliderMin = value;
    this.sliderMin$.next(value);
  }

  get sliderMax() {
    return this._sliderMax;
  }

  set sliderMax(value: number[]) {
    this._sliderMax = value;
    this.sliderMax$.next(value);
  }

  get indexSelected() {
    return this._indexSelected;
  }

  set indexSelected(value: number) {
    this._indexSelected = value;
    this.indexSelected$.next(value);
  }

  get thermalLayersLoaded() {
    return this._thermalLayersLoaded;
  }

  set thermalLayersLoaded(value: boolean) {
    this._thermalLayersLoaded = value;
    this.thermalLayersLoaded$.next(value);
  }

  get paletteSelected() {
    return this._paletteSelected;
  }

  set paletteSelected(value: string) {
    this._paletteSelected = value;
    this.paletteSelected$.next(value);
  }
}
