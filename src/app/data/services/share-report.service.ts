import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { AngularFirestore } from '@angular/fire/firestore';

import { AnomaliaService } from './anomalia.service';
import { FilterControlService } from './filter-control.service';

import { FilterInterface } from '@core/models/filter';
import { GradientFilter } from '@core/models/gradientFilter';
import { PerdidasFilter } from '@core/models/perdidasFilter';
import { TempMaxFilter } from '@core/models/tempMaxFilter';
import { AreaFilter } from '@core/models/areaFilter';
import { ClaseFilter } from '@core/models/claseFilter';
import { CriticidadFilter } from '@core/models/criticidadFilter';
import { ModuloPcFilter } from '@core/models/moduloFilter';
import { TipoElemFilter } from '@core/models/tipoPcFilter';
import { ZonaFilter } from '@core/models/zonaFilter';
import { ParamsFilterShare } from '@core/models/paramsFilterShare';

@Injectable({
  providedIn: 'root',
})
export class ShareReportService {
  private params: ParamsFilterShare = {};
  private params$ = new BehaviorSubject<ParamsFilterShare>(this.params);
  private idDB: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private afs: AngularFirestore,
    private anomaliaService: AnomaliaService,
    private filterControlService: FilterControlService
  ) {}

  initService(id: string) {
    this.subscriptions.add(
      this.afs
        .collection('share')
        .doc<ParamsFilterShare>(id)
        .get()
        .subscribe((params) => {
          this.params = params.data();
          this.params.id = params.id;

          // guardamos la fecha de acceso
          this.setLastAccess();

          // actualizamos el numero de accesos
          this.updateNumAccess();

          this.params$.next(this.params);
        })
    );
  }

  setPlantaId(plantaId: string) {
    this.params.plantaId = plantaId;
    this.params$.next(this.params);
  }

  setSelectedInformeId(informeId: string) {
    this.params.informeId = informeId;
    this.params$.next(this.params);
  }

  getCreateDate(): number {
    const date = new Date();
    return date.getTime();
  }

  setCreatedDate() {
    const date = new Date();
    this.params.fechaCreacion = date.getTime();
    this.params$.next(this.params);
  }

  setLastAccess() {
    const date = new Date();
    this.params.ultimoAcceso = date.getTime();

    this.afs
      .collection('share')
      .doc(this.params.id)
      .update(this.params)
      .catch((err) => {
        console.log(err);
      });
  }

  updateNumAccess() {
    if (this.params.hasOwnProperty('numAccesos')) {
      this.params.numAccesos = this.params.numAccesos + 1;
    } else {
      this.params.numAccesos = 1;
    }

    this.afs
      .collection('share')
      .doc(this.params.id)
      .update(this.params)
      .catch((err) => {
        console.log(err);
      });
  }

  createRecommendedActionsParams(tipos: number[]): ParamsFilterShare {
    const params: ParamsFilterShare = {};

    params.tipo = tipos;

    return params;
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
        this.params.area = [];
        (filter as AreaFilter).coords[0].forEach((v) => this.params.area.push(...v));
        // this.params.coordsArea = [...(filter as AreaFilter).coords[0]];
        break;
      case 'clase':
        if (this.params.clase === undefined || this.params.clase === null) {
          this.params.clase = [false, false, false];
          this.params.clase[(filter as ClaseFilter).clase - 1] = !this.params.clase[(filter as ClaseFilter).clase - 1];
        } else {
          this.params.clase[(filter as ClaseFilter).clase - 1] = !this.params.clase[(filter as ClaseFilter).clase - 1];
        }
        break;
      case 'criticidad':
        if (this.params.criticidad === undefined || this.params.criticidad === null) {
          const criticidad = new Array(this.anomaliaService.criterioCriticidad.labels.length).fill(false);

          this.params.criticidad = criticidad;
          this.params.criticidad[(filter as CriticidadFilter).criticidad] =
            !this.params.criticidad[(filter as CriticidadFilter).criticidad];
        } else {
          this.params.criticidad[(filter as CriticidadFilter).criticidad] =
            !this.params.criticidad[(filter as CriticidadFilter).criticidad];
        }
        break;
      case 'modulo':
        this.params.modulo = (filter as ModuloPcFilter).modulo;
        break;
      case 'tipo':
        if (this.params.tipo === undefined || this.params.tipo === null) {
          // inicializamos el array tipo con valores null
          this.params.tipo = [];
          for (let i = 0; i < (filter as TipoElemFilter).numOfTipos; i++) {
            this.params.tipo.push(null);
          }
          this.params.tipo[(filter as TipoElemFilter).position] = (filter as TipoElemFilter).tipo;
        } else {
          this.params.tipo[(filter as TipoElemFilter).position] = (filter as TipoElemFilter).tipo;
        }
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
        this.params.area = null;
        break;
      case 'clase':
        this.params.clase[(filter as ClaseFilter).clase - 1] = !this.params.clase[(filter as ClaseFilter).clase - 1];
        break;
      case 'criticidad':
        this.params.criticidad[(filter as CriticidadFilter).criticidad] =
          !this.params.criticidad[(filter as CriticidadFilter).criticidad];
        break;
      case 'modulo':
        this.params.modulo = null;
        break;
      case 'tipo':
        this.params.tipo[(filter as TipoElemFilter).position] = null;
        break;
      case 'zona':
        this.params.zona = null;
        break;
    }
  }

  resetAllParams() {
    // resetea todos los parametros excepto informeID y plantaId
    Object.keys(this.params).forEach((i) => {
      if (this.params[i] !== this.params.informeId && this.params[i] !== this.params.plantaId) {
        this.params[i] = null;
      }
    });
  }

  saveParams(params?: ParamsFilterShare) {
    let paramsToSave = this.params;
    if (params) {
      paramsToSave = params;
    }
    // guarda los params en la DB
    this.idDB = this.afs.createId();
    return this.afs
      .collection('share')
      .doc(this.idDB)
      .set(paramsToSave)
      .then(() => {
        console.log('Params guardados correctamente');
      })
      .catch((error) => {
        console.error('Error al guardar params: ', error);
      });
  }

  getParamsDbId(): string {
    return this.idDB;
  }

  getParamsById(id: string) {
    return this.afs.collection('share').doc(id);
  }

  getParams() {
    return this.params$.asObservable();
  }

  getFiltersByParams(id: string) {
    const filters: FilterInterface[] = [];
    const filters$ = new BehaviorSubject<FilterInterface[]>(filters);

    this.subscriptions.add(
      this.afs
        .collection('share')
        .doc(id)
        .get()
        .subscribe((params) => {
          this.params = params.data();

          if (Object.keys(this.params).includes('minGradient')) {
            if (this.params.minGradient !== null) {
              const gradientFilter = new GradientFilter('gradient', this.params.minGradient, this.params.maxGradient);
              filters.push(gradientFilter);
            }
          }
          if (Object.keys(this.params).includes('minPerdidas')) {
            if (this.params.minPerdidas !== null) {
              const perdidasFilter = new PerdidasFilter('perdidas', this.params.minPerdidas, this.params.maxPerdidas);
              filters.push(perdidasFilter);
            }
          }
          if (Object.keys(this.params).includes('minTempMax')) {
            if (this.params.minTempMax !== null) {
              const tempMaxFilter = new TempMaxFilter('tempMax', this.params.minTempMax, this.params.maxTempMax);
              filters.push(tempMaxFilter);
            }
          }
          if (Object.keys(this.params).includes('area')) {
            if (this.params.area !== null) {
              const coordinates = [];
              this.params.area.forEach((num, index) => {
                if (!(index % 2)) {
                  const c = [num, this.params.area[index + 1]];
                  coordinates.push(c);
                }
              });
              const areaFilter = new AreaFilter('area', [coordinates]);
              filters.push(areaFilter);
            }
          }
          if (Object.keys(this.params).includes('clase')) {
            if (this.params.clase !== null) {
              this.params.clase.forEach((clase, index) => {
                if (clase) {
                  const claseFilter = new ClaseFilter('CoA_' + (index + 1), 'clase', index + 1);
                  filters.push(claseFilter);
                }
              });
            }
          }
          if (Object.keys(this.params).includes('criticidad')) {
            if (this.params.criticidad !== null) {
              this.params.criticidad.forEach((crit, index) => {
                if (crit) {
                  const criticidadFilter = new CriticidadFilter(index.toString(), 'criticidad', index);
                  filters.push(criticidadFilter);
                }
              });
            }
          }
          if (Object.keys(this.params).includes('modulo')) {
            if (this.params.modulo !== null) {
              const moduloFilter = new ModuloPcFilter('', 'modulo', this.params.modulo);
              filters.push(moduloFilter);
            }
          }
          if (Object.keys(this.params).includes('tipo')) {
            if (this.params.tipo !== null) {
              let tiposSelected = this.filterControlService.tiposSelected;
              this.params.tipo.forEach((tipo, index, tipos) => {
                if (tipo !== undefined && tipo !== null) {
                  const tipoFilter = new TipoElemFilter(`tipo_${tipo}`, 'tipo', tipo, tipos.length, index);
                  filters.push(tipoFilter);

                  tiposSelected[tipo] = true;
                }
              });

              this.filterControlService.tiposSelected = tiposSelected;
            }
          }
          if (Object.keys(this.params).includes('zona')) {
            if (this.params.zona !== null) {
              const zonaFilter = new ZonaFilter('', 'zona', this.params.zona);
              filters.push(zonaFilter);
            }
          }
          filters$.next(filters);
        })
    );
    return filters$.asObservable();
  }

  getSharedReports(): Observable<ParamsFilterShare[]> {
    return this.afs.collection('share').valueChanges();
  }

  resetService() {
    this.params = {};
    this.idDB = undefined;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }
}
