import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { BehaviorSubject, Observable } from 'rxjs';

import { ModuloBruto } from '@core/models/moduloBruto';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ThermalService {
  private _sliderMin: number = 25;
  public sliderMinSource = new BehaviorSubject<number>(this._sliderMin);

  private _sliderMax: number = 75;
  public sliderMaxSource = new BehaviorSubject<number>(this._sliderMax);

  constructor(public afs: AngularFirestore) {}

  getModulosBrutos(thermalLayerId: string): Observable<ModuloBruto[]> {
    const query$ = this.afs
      .collection<ModuloBruto>('thermalLayers/' + thermalLayerId + '/modulosEnBruto')
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

  get sliderMin() {
    return this._sliderMin;
  }
  set sliderMin(value: number) {
    this._sliderMin = value;
    this.sliderMaxSource.next(value);
  }

  get sliderMax() {
    return this._sliderMax;
  }
  set sliderMax(value: number) {
    this._sliderMax = value;

    this.sliderMinSource.next(value);
  }
}
