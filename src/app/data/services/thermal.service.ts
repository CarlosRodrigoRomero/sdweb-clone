import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { ThermalLayerInterface } from '@core/models/thermalLayer';



@Injectable({
  providedIn: 'root',
})
export class ThermalService {
  private _thermalLayers: ThermalLayerInterface[] = [];
  thermalLayers$ = new BehaviorSubject<ThermalLayerInterface[]>(this._thermalLayers);

  private _sliderMin: number[] = [];
  sliderMin$ = new BehaviorSubject<number[]>(this._sliderMin);

  private _sliderMax: number[] = [];
  sliderMax$ = new BehaviorSubject<number[]>(this._sliderMax);

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
        map((thermalLayers) => thermalLayers.filter((thermalLayer) => informesId.includes(thermalLayer.informeId)))
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
        .subscribe((tL) => (this.thermalLayers = tL))
    );

    return this.thermalLayers$;
  }

  

  resetService() {
    this.thermalLayers = [];
    this.sliderMin = [];
    this.sliderMax = [];

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  get thermalLayers() {
    return this._thermalLayers;
  }

  set thermalLayers(value: ThermalLayerInterface[]) {
    this._thermalLayers = value;
    this.thermalLayers$.next(value);
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
}
