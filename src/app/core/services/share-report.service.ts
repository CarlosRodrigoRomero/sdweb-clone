import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { AngularFirestore } from '@angular/fire/firestore';

import { FilterInterface } from '@core/models/filter';
import { GradientFilter } from '@core/models/gradientFilter';
import { PerdidasFilter } from '@core/models/perdidasFilter';
import { TempMaxFilter } from '@core/models/tempMaxFilter';
import { AreaFilter } from '@core/models/areaFilter';
import { ClasePcFilter } from '@core/models/clasePcFilter';
import { ModuloPcFilter } from '@core/models/moduloFilter';
import { TipoPcFilter } from '@core/models/tipoPcFilter';
import { ZonaFilter } from '@core/models/zonaFilter';
import { ParamsFilterShare } from '@core/models/paramsFilterShare';

@Injectable({
  providedIn: 'root',
})
export class ShareReportService {
  private params: ParamsFilterShare = {};
  private params$ = new BehaviorSubject<ParamsFilterShare>(this.params);
  private id: string;
  private paramsDB: ParamsFilterShare = {};

  constructor(private afs: AngularFirestore) {}

  setInformeID(id: string) {
    this.params.informeID = id;
    this.params$.next(this.params);
  }

  setParams(filter: FilterInterface) {
    switch (filter.type) {
      case 'gradient':
        this.params.minGradient = (filter as GradientFilter).rangoMin;
        this.params.maxGradient = (filter as GradientFilter).rangoMax;
        break;
      case 'perdidas':
        this.params.minPerdidas = (filter as PerdidasFilter).rangoMin;
        this.params.maxPerdidas = (filter as PerdidasFilter).rangoMax;
        break;
      case 'tempMax':
        this.params.minTempMax = (filter as TempMaxFilter).rangoMin;
        this.params.maxTempMax = (filter as TempMaxFilter).rangoMax;
        break;
      case 'area':
        this.params.coordsArea = (filter as AreaFilter).coords;
        break;
      case 'clase':
        this.params.clase = (filter as ClasePcFilter).clase;
        break;
      case 'modulo':
        this.params.modulo = (filter as ModuloPcFilter).modulo;
        break;
      case 'tipo':
        this.params.tipo = (filter as TipoPcFilter).tipo;
        break;
      case 'zona':
        this.params.zona = (filter as ZonaFilter).zona;
        break;
    }
  }

  resetParams(filter: FilterInterface) {
    switch (filter.type) {
      case 'gradient':
        this.params.minGradient = null;
        this.params.maxGradient = null;
        break;
      case 'perdidas':
        this.params.minPerdidas = null;
        this.params.maxPerdidas = null;
        break;
      case 'tempMax':
        this.params.minTempMax = null;
        this.params.maxTempMax = null;
        break;
      case 'area':
        this.params.coordsArea = null;
        break;
      case 'clase':
        this.params.clase = null;
        break;
      case 'modulo':
        this.params.modulo = null;
        break;
      case 'tipo':
        this.params.tipo = null;
        break;
      case 'zona':
        this.params.zona = null;
        break;
    }
  }

  resetAllParams() {
    // resetea todos los parametros excepto el informeID
    Object.keys(this.params).forEach((i) => {
      if (this.params[i] !== this.params.informeID) {
        this.params[i] = null;
      }
    });
  }

  saveParams() {
    // guarda los params en la DB
    this.id = this.afs.createId();
    this.afs
      .collection('share')
      .doc(this.id)
      .set(this.params)
      .then(() => {
        console.log('Params guardados correctamente ' + this.id);
      })
      .catch((error) => {
        console.error('Error writing document: ', error);
      });
  }

  getParamsDbId(): string {
    return this.id;
  }

  getParamsById(id: string) {
    this.afs
      .collection('share')
      .doc(id)
      .get()
      .subscribe((params) => (this.paramsDB = params.data()));
  }

  getParams() {
    return this.params$.asObservable();
  }

  getFiltersByParams(): FilterInterface[] {
    const filters: FilterInterface[] = [];

    if (Object.keys(this.paramsDB).includes('minGradient')) {
      if (this.paramsDB.minGradient !== null) {
        const gradientFilter = new GradientFilter('gradient', this.paramsDB.minGradient, this.paramsDB.maxGradient);
        filters.push(gradientFilter);
      }
    } else if (Object.keys(this.paramsDB).includes('minPerdidas')) {
      if (this.paramsDB.minPerdidas !== null) {
        const perdidasFilter = new PerdidasFilter('perdidas', this.paramsDB.minPerdidas, this.paramsDB.maxPerdidas);
        filters.push(perdidasFilter);
      }
    } else if (Object.keys(this.paramsDB).includes('minTempMax')) {
      if (this.paramsDB.minTempMax !== null) {
        const tempMaxFilter = new TempMaxFilter('tempMax', this.paramsDB.minTempMax, this.paramsDB.maxTempMax);
        filters.push(tempMaxFilter);
      }
    } else if (Object.keys(this.paramsDB).includes('area')) {
      if (this.paramsDB.coordsArea !== null) {
        const areaFilter = new AreaFilter('area', this.paramsDB.coordsArea);
        filters.push(areaFilter);
      }
    } else if (Object.keys(this.paramsDB).includes('clase')) {
      if (this.paramsDB.clase !== null) {
        const claseFilter = new ClasePcFilter('', 'clase', this.paramsDB.clase);
        filters.push(claseFilter);
      }
    } else if (Object.keys(this.paramsDB).includes('modulo')) {
      if (this.paramsDB.modulo !== null) {
        const moduloFilter = new ModuloPcFilter('', 'modulo', this.paramsDB.modulo);
        filters.push(moduloFilter);
      }
    } else if (Object.keys(this.paramsDB).includes('')) {
      if (this.paramsDB.tipo !== null) {
        const tipoFilter = new TipoPcFilter('', 'tipo', this.paramsDB.tipo);
        filters.push(tipoFilter);
      }
    } else if (Object.keys(this.paramsDB).includes('zona')) {
      if (this.paramsDB.zona !== null) {
        const zonaFilter = new ZonaFilter('', 'zona', this.paramsDB.zona);
        filters.push(zonaFilter);
      }
    }
    return filters;
  }
}
