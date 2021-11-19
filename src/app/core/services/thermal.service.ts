import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { ThermalLayerInterface } from '@core/models/thermalLayer';

@Injectable({
  providedIn: 'root',
})
export class ThermalService {
  private _thermalLayers: ThermalLayerInterface[] = [];
  thermalLayers$ = new BehaviorSubject<ThermalLayerInterface[]>(this._thermalLayers);

  private _sliderMin: number = 25;
  public sliderMinSource = new BehaviorSubject<number>(this._sliderMin);

  private _sliderMax: number = 75;
  public sliderMaxSource = new BehaviorSubject<number>(this._sliderMax);

  constructor(private afs: AngularFirestore) {}

  getThermalLayers(): Observable<ThermalLayerInterface[]> {
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
      .subscribe((tL) => {
        this.thermalLayers = tL;
        // if (tL.length > 0) {
        //   this.thermalLayers = tL;
        // } else {
        //   this.thermalLayers = undefined;
        // }
      });

    return this.thermalLayers$;
  }

  resetService() {
    this.thermalLayers = [];
    this.sliderMin = 25;
    this.sliderMax = 75;
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

  set sliderMin(value: number) {
    this._sliderMin = value;
    this.sliderMinSource.next(value);
  }

  get sliderMax() {
    return this._sliderMax;
  }

  set sliderMax(value: number) {
    this._sliderMax = value;
    this.sliderMaxSource.next(value);
  }
}
