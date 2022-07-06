import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';

import { OlMapService } from '@data/services/ol-map.service';

import { ParamsFilterShare } from '@core/models/paramsFilterShare';

@Injectable({
  providedIn: 'root',
})
export class FilterControlService {
  minPerdidasDefault = 0;
  private _minPerdidas = 0;
  minPerdidasSource = new BehaviorSubject<number>(this._minPerdidas);
  maxPerdidasDefault = 100;
  private _maxPerdidas = 100;
  maxPerdidas$ = new BehaviorSubject<number>(this._maxPerdidas);

  minTempMaxDefault = 50;
  private _minTempMax = 50;
  minTempMax$ = new BehaviorSubject<number>(this._minTempMax);
  maxTempMaxDefault = 120;
  private _maxTempMax = 120;
  maxTempMax$ = new BehaviorSubject<number>(this._maxTempMax);

  minGradienteDefault = 0;
  private _minGradiente = 0;
  minGradiente$ = new BehaviorSubject<number>(this._minGradiente);
  maxGradienteDefault = 80;
  private _maxGradiente = 80;
  maxGradiente$ = new BehaviorSubject<number>(this._maxGradiente);

  private _labelTipoDefaultStatus = true;
  public labelTipoDefaultStatus$ = new BehaviorSubject<boolean>(this._labelTipoDefaultStatus);
  public selectedTipoDefaultLabel = 'Tipo de anomalía';
  private _selectedTipoLabels: string[] = [this.selectedTipoDefaultLabel];
  public selectedTipoLabels$ = new BehaviorSubject<string[]>(this._selectedTipoLabels);
  public tiposSelectedDefault: boolean[] = [];
  private _tiposSelected: boolean[] = [];
  public tiposSelected$ = new BehaviorSubject<boolean[]>(this._tiposSelected);

  private _claseSelected: boolean[] = [false, false, false];
  public claseSelected$ = new BehaviorSubject<boolean[]>(this._claseSelected);

  private _criticidadSelected: boolean[] = [false, false, false, false, false];
  public criticidadSelected$ = new BehaviorSubject<boolean[]>(this._criticidadSelected);

  private _activeDrawArea: boolean = false;
  public activeDrawArea$ = new BehaviorSubject<boolean>(this._activeDrawArea);

  private _activeDeleteArea: boolean = false;
  public activeDeleteArea$ = new BehaviorSubject<boolean>(this._activeDeleteArea);

  constructor(private olMapService: OlMapService) {}

  setInitParams(params: ParamsFilterShare) {
    if (params.minPerdidas !== undefined && params.minPerdidas !== null) {
      this.minPerdidas = params.minPerdidas;
    }
    if (params.maxPerdidas !== undefined && params.maxPerdidas !== null) {
      this.maxPerdidas = params.maxPerdidas;
    }
    if (params.minTempMax !== undefined && params.minTempMax !== null) {
      this.minTempMax = params.minTempMax;
    }
    if (params.maxTempMax !== undefined && params.maxTempMax !== null) {
      this.maxTempMax = params.maxTempMax;
    }
    if (params.minGradient !== undefined && params.minGradient !== null) {
      this.minGradiente = params.minGradient;
    }
    if (params.maxGradient !== undefined && params.maxGradient !== null) {
      this.maxGradiente = params.maxGradient;
    }
    if (params.clase !== undefined && params.clase !== null) {
      this.claseSelected = params.clase;
    }
    if (params.criticidad !== undefined && params.criticidad !== null) {
      this.criticidadSelected = params.criticidad;
    }
    if (params.tipo !== undefined && params.tipo !== null) {
      this.tiposSelected = [];
      params.tipo.forEach((tipo) => {
        if (tipo !== null) {
          this.tiposSelected.push(true);
        } else {
          this.tiposSelected.push(false);
        }
      });
    }
  }

  resetFilters() {
    // PERDIDAS
    this.minPerdidas = this.minPerdidasDefault;
    this.maxPerdidas = this.maxPerdidasDefault;

    // TEMPERATURA MAXIMA
    this.minTempMax = this.minTempMaxDefault;
    this.maxTempMax = this.maxTempMaxDefault;

    // GRADIENTE NORMALIZADO
    this.minGradiente = this.minGradienteDefault;
    this.maxGradiente = this.maxGradienteDefault;

    // TIPOS DE ANOMALIAS
    const tipSel: boolean[] = [];
    this.tiposSelected.forEach((sel) => {
      tipSel.push(false);
    });
    this.tiposSelected = tipSel;
    // Labels tipos de anomalias
    this.selectedTipoLabels = [this.selectedTipoDefaultLabel];
    this.labelTipoDefaultStatus = true;

    // CLASE
    this.claseSelected = [false, false, false];

    // CRITICIDAD
    this.criticidadSelected = [false, false, false, false, false];

    // AREA
    this.activeDrawArea = false;
    this.activeDeleteArea = false;
    // elimina el poligono del mapa
    this.olMapService.deleteAllDrawLayers();
    // cancelamos interacción draw
    combineLatest([this.olMapService.map$, this.olMapService.draw$])
      .pipe(take(1))
      .subscribe(([map, draw]) => {
        map.removeInteraction(draw);
      });
  }

  resetService() {
    this.minPerdidas = 0;
    this.maxPerdidas = 100;
    this.minTempMax = 0;
    this.maxTempMax = 120;
    this.minGradiente = 0;
    this.maxGradiente = 80;
    this.labelTipoDefaultStatus = true;
    this.selectedTipoLabels = [this.selectedTipoDefaultLabel];
    this.tiposSelected = [];
    this.claseSelected = [false, false, false];
    this.criticidadSelected = [false, false, false, false, false];
    this.activeDrawArea = false;
    this.activeDeleteArea = false;
  }

  //////////////////////////////////////////////////

  /* PERDIDAS */
  get minPerdidas() {
    return this._minPerdidas;
  }

  set minPerdidas(value: number) {
    this._minPerdidas = value;
    this.minPerdidasSource.next(value);
  }

  get maxPerdidas() {
    return this._maxPerdidas;
  }

  set maxPerdidas(value: number) {
    this._maxPerdidas = value;
    this.maxPerdidas$.next(value);
  }

  /* TEMPERATURA MAXIMA */
  get minTempMax() {
    return this._minTempMax;
  }

  set minTempMax(value: number) {
    this._minTempMax = value;
    this.minTempMax$.next(value);
  }

  get maxTempMax() {
    return this._maxTempMax;
  }

  set maxTempMax(value: number) {
    this._maxTempMax = value;
    this.maxTempMax$.next(value);
  }

  /* GRADIENTE NORMALIZADO */
  get minGradiente() {
    return this._minGradiente;
  }

  set minGradiente(value: number) {
    this._minGradiente = value;
    this.minGradiente$.next(value);
  }

  get maxGradiente() {
    return this._maxGradiente;
  }

  set maxGradiente(value: number) {
    this._maxGradiente = value;
    this.maxGradiente$.next(value);
  }

  /* TIPOS DE ANOMALIAS */
  get tiposSelected() {
    return this._tiposSelected;
  }

  set tiposSelected(value: boolean[]) {
    this._tiposSelected = value;
    this.tiposSelected$.next(value);
  }

  /* Labels tipo de anomalias */
  get selectedTipoLabels() {
    return this._selectedTipoLabels;
  }

  set selectedTipoLabels(value: string[]) {
    this._selectedTipoLabels = value;
    this.selectedTipoLabels$.next(value);
  }

  get labelTipoDefaultStatus() {
    return this._labelTipoDefaultStatus;
  }

  set labelTipoDefaultStatus(value: boolean) {
    this._labelTipoDefaultStatus = value;
    this.labelTipoDefaultStatus$.next(value);
  }

  /* CLASE */
  get claseSelected() {
    return this._claseSelected;
  }

  set claseSelected(value: boolean[]) {
    this._claseSelected = value;
    this.claseSelected$.next(value);
  }

  /* CRITICIDAD */
  get criticidadSelected() {
    return this._criticidadSelected;
  }

  set criticidadSelected(value: boolean[]) {
    this._criticidadSelected = value;
    this.criticidadSelected$.next(value);
  }

  /* AREA */
  get activeDrawArea() {
    return this._activeDrawArea;
  }

  set activeDrawArea(value: boolean) {
    this._activeDrawArea = value;
    this.activeDrawArea$.next(value);
  }

  get activeDeleteArea() {
    return this._activeDeleteArea;
  }

  set activeDeleteArea(value: boolean) {
    this._activeDeleteArea = value;
    this.activeDeleteArea$.next(value);
  }
}
