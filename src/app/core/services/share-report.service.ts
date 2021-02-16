import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

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
  public params$ = new BehaviorSubject<ParamsFilterShare>(this.params);

  constructor() {}

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
        this.params.minGradient = undefined;
        this.params.maxGradient = undefined;
        break;
      case 'perdidas':
        this.params.minPerdidas = undefined;
        this.params.maxPerdidas = undefined;
        break;
      case 'tempMax':
        this.params.minTempMax = undefined;
        this.params.maxTempMax = undefined;
        break;
      case 'area':
        this.params.coordsArea = undefined;
        break;
      case 'clase':
        this.params.clase = undefined;
        break;
      case 'modulo':
        this.params.modulo = undefined;
        break;
      case 'tipo':
        this.params.tipo = undefined;
        break;
      case 'zona':
        this.params.zona = undefined;
        break;
    }
  }

  resetAllParams() {
    // resetea todos los parametros excepto el informeID
    Object.keys(this.params).forEach((i) => {
      if (this.params[i] !== this.params.informeID) {
        this.params[i] = undefined;
      }
    });
  }

  getParams() {
    return this.params$.asObservable();
  }
}
