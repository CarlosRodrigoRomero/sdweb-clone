import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { ThermalLayerInterface } from '@core/models/thermalLayer';

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
}
