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
import { ModuloBruto } from '@core/models/moduloBruto';
import { FilterModuloBruto } from '@core/models/filterModuloBruto';
import { FilterableElement } from '@core/models/filtrableInterface';
import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Injectable({
  providedIn: 'root',
})
export class StructuresService {
  private _informeId: string;
  private _planta: PlantaInterface = {};
  private planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _deleteMode = false;
  public deleteMode$ = new BehaviorSubject<boolean>(this._deleteMode);

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

  getFiltersParams(thermalLayerId: string): Observable<FilterModuloBruto[]> {
    const query$ = this.afs
      .collection('thermalLayers/' + thermalLayerId + '/filters')
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

  saveFilter(thermalLayerId: string, filterType: string, value: any) {
    const colRef = this.afs.collection('thermalLayers/' + thermalLayerId + '/filters');

    colRef
      .doc('filter')
      .update({
        [filterType]: value,
      })
      .then(() => {
        console.log('Filtro guardado correctamente');
      })
      .catch((error) => {
        console.error('Error al guardar filtro: ', error);
      });
  }

  deleteFilter(thermalLayerId: string, filterType: string) {
    const colRef = this.afs.collection('thermalLayers/' + thermalLayerId + '/filters');
    colRef.doc('filter').update({
      [filterType]: firebase.firestore.FieldValue.delete(),
    });
  }

  applyFilters(filters: FilterModuloBruto[]) {
    const filter = filters[0];
    if (filter.confianzaM !== undefined) {
      const confianzaFilter = new ModuloBrutoFilter('confianzaM', filter.confianzaM);
      this.filterService.addFilter(confianzaFilter);
    }
    if (filter.aspectRatioM !== undefined) {
      const aspectRatioFilter = new ModuloBrutoFilter('aspectRatioM', filter.aspectRatioM);
      this.filterService.addFilter(aspectRatioFilter);
    }
    if (filter.areaM !== undefined) {
      // usamos 'areaM' para diferenciarlo del filtro 'area'
      const areaFilter = new ModuloBrutoFilter('areaM', filter.areaM);
      this.filterService.addFilter(areaFilter);
    }
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

  get deleteMode() {
    return this._deleteMode;
  }

  set deleteMode(value: boolean) {
    this._deleteMode = value;
    this.deleteMode$.next(value);
  }
}
