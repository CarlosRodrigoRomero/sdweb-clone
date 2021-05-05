import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFirestore } from '@angular/fire/firestore';

import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { PlantaService } from './planta.service';
import { InformeService } from './informe.service';

import { PlantaInterface } from '@core/models/planta';
import { ModuloBruto } from '@core/models/moduloBruto';

@Injectable({
  providedIn: 'root',
})
export class StructuresService {
  private _informeId: string;
  private _planta: PlantaInterface = {};
  private planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);

  constructor(
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    public afs: AngularFirestore
  ) {}

  initService(): Observable<boolean> {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    this.informeService
      .getInforme(this._informeId)
      .pipe(
        take(1),
        switchMap((informe) => this.plantaService.getPlanta(informe.plantaId))
      )
      .pipe(take(1))
      .subscribe((planta) => {
        this.planta = planta;
        this.initialized$.next(true);
      });
    return this.initialized$;
  }

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
}
