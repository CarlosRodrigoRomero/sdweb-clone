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

  private _labelModeloDefaultStatus = true;
  public labelModeloDefaultStatus$ = new BehaviorSubject<boolean>(this._labelModeloDefaultStatus);
  public selectedModeloDefaultLabel = 'Modelo módulo';
  private _selectedModeloLabels: string[] = [this.selectedModeloDefaultLabel];
  public selectedModeloLabels$ = new BehaviorSubject<string[]>(this._selectedModeloLabels);
  public modelosSelectedDefault: boolean[] = [];
  private _modelosSelected: boolean[] = [];
  public modelosSelected$ = new BehaviorSubject<boolean[]>(this._modelosSelected);

  private _labelZonaDefaultStatus = true;
  public labelZonaDefaultStatus$ = new BehaviorSubject<boolean>(this._labelZonaDefaultStatus);
  public selectedZonaDefaultLabel = 'Zona';
  private _selectedZonaLabels: string[] = [this.selectedZonaDefaultLabel];
  public selectedZonaLabels$ = new BehaviorSubject<string[]>(this._selectedZonaLabels);
  public zonasSelectedDefault: boolean[] = [];
  private _zonasSelected: boolean[] = [];
  public zonasSelected$ = new BehaviorSubject<boolean[]>(this._zonasSelected);

  private _labelStatusDefaultStatus = true;
  public labelStatusDefaultStatus$ = new BehaviorSubject<boolean>(this._labelStatusDefaultStatus);
  public selectedStatusDefaultLabel = 'Status';
  private _selectedStatusLabels: string[] = [this.selectedStatusDefaultLabel];
  public selectedStatusLabels$ = new BehaviorSubject<string[]>(this._selectedStatusLabels);
  public statusSelectedDefault: boolean[] = [];
  private _statusSelected: boolean[] = [];
  public statusSelected$ = new BehaviorSubject<boolean[]>(this._statusSelected);

  private _claseSelected: boolean[] = [false, false, false];
  public claseSelected$ = new BehaviorSubject<boolean[]>(this._claseSelected);

  private _criticidadSelected: boolean[] = [false, false, false, false, false];
  public criticidadSelected$ = new BehaviorSubject<boolean[]>(this._criticidadSelected);

  // private _statusSelected: boolean[] = [false, false, false];
  // public statusSelected$ = new BehaviorSubject<boolean[]>(this._statusSelected);

  private _reparableSelected: boolean[] = [false, false];
  public reparableSelected$ = new BehaviorSubject<boolean[]>(this._reparableSelected);

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
    if (params.reparable !== undefined && params.reparable !== null) {
      this.reparableSelected = params.reparable;
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
    if (params.modelo !== undefined && params.modelo !== null) {
      this.modelosSelected = [];
      params.modelo.forEach((modelo) => {
        if (modelo !== null) {
          this.modelosSelected.push(true);
        } else {
          this.modelosSelected.push(false);
        }
      });
    }
    if (params.zonas !== undefined && params.zonas !== null) {
      this.zonasSelected = [];
      params.zonas.forEach((zona) => {
        if (zona !== null) {
          this.zonasSelected.push(true);
        } else {
          this.zonasSelected.push(false);
        }
      });
    }
    if (params.status !== undefined && params.status !== null) {
      this.statusSelected = [];
      params.status.forEach((s) => {
        if (s !== null) {
          this.statusSelected.push(true);
        } else {
          this.statusSelected.push(false);
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

    // MODELO DE MÓDULOS
    const modSel: boolean[] = [];
    this.modelosSelected.forEach((sel) => {
      modSel.push(false);
    });
    this.modelosSelected = modSel;
    // Labels modelo de módulos
    this.selectedModeloLabels = [this.selectedModeloDefaultLabel];
    this.labelModeloDefaultStatus = true;

    // ZONAS
    const zonaSel: boolean[] = [];
    this.zonasSelected.forEach((sel) => {
      zonaSel.push(false);
    });
    this.zonasSelected = zonaSel;
    // Labels zonas
    this.selectedZonaLabels = [this.selectedZonaDefaultLabel];
    this.labelZonaDefaultStatus = true;

    // STATUS
    const statusSel: boolean[] = [];
    this.statusSelected.forEach((sel) => {
      statusSel.push(false);
    });
    this.statusSelected = statusSel;
    // Labels status
    this.selectedStatusLabels = [this.selectedStatusDefaultLabel];
    this.labelStatusDefaultStatus = true;

    // CLASE
    this.claseSelected = [false, false, false];

    // CRITICIDAD
    this.criticidadSelected = [false, false, false, false, false];

    // STATUS
    this.statusSelected = [false, false, false];

    // REPARABLE
    this.reparableSelected = [false, false];

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
    this.labelModeloDefaultStatus = true;
    this.selectedModeloLabels = [this.selectedModeloDefaultLabel];
    this.labelZonaDefaultStatus = true;
    this.selectedZonaLabels = [this.selectedZonaDefaultLabel];
    this.labelStatusDefaultStatus = true;
    this.selectedStatusLabels = [this.selectedStatusDefaultLabel];
    this.tiposSelected = [];
    this.claseSelected = [false, false, false];
    this.criticidadSelected = [false, false, false, false, false];
    this.statusSelected = [false, false, false];
    this.reparableSelected = [false, false];
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

  /* MODELO DE MÓDULOS */
  get modelosSelected() {
    return this._modelosSelected;
  }

  set modelosSelected(value: boolean[]) {
    this._modelosSelected = value;
    this.modelosSelected$.next(value);
  }

  /* Labels modelo de módulos */
  get selectedModeloLabels() {
    return this._selectedModeloLabels;
  }

  set selectedModeloLabels(value: string[]) {
    this._selectedModeloLabels = value;
    this.selectedModeloLabels$.next(value);
  }

  get labelModeloDefaultStatus() {
    return this._labelModeloDefaultStatus;
  }

  set labelModeloDefaultStatus(value: boolean) {
    this._labelModeloDefaultStatus = value;
    this.labelModeloDefaultStatus$.next(value);
  }

  /* ZONAS */
  get zonasSelected() {
    return this._zonasSelected;
  }

  set zonasSelected(value: boolean[]) {
    this._zonasSelected = value;
    this.zonasSelected$.next(value);
  }

  /* Labels zonas */
  get selectedZonaLabels() {
    return this._selectedZonaLabels;
  }

  set selectedZonaLabels(value: string[]) {
    this._selectedZonaLabels = value;
    this.selectedZonaLabels$.next(value);
  }

  get labelZonaDefaultStatus() {
    return this._labelZonaDefaultStatus;
  }

  set labelZonaDefaultStatus(value: boolean) {
    this._labelZonaDefaultStatus = value;
    this.labelZonaDefaultStatus$.next(value);
  }

  /* STATUS */
  get statusSelected() {
    return this._statusSelected;
  }

  set statusSelected(value: boolean[]) {
    this._statusSelected = value;
    this.statusSelected$.next(value);
  }

  /* Labels status */
  get selectedStatusLabels() {
    return this._selectedStatusLabels;
  }

  set selectedStatusLabels(value: string[]) {
    this._selectedStatusLabels = value;
    this.selectedStatusLabels$.next(value);
  }

  get labelStatusDefaultStatus() {
    return this._labelStatusDefaultStatus;
  }

  set labelStatusDefaultStatus(value: boolean) {
    this._labelStatusDefaultStatus = value;
    this.labelStatusDefaultStatus$.next(value);
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

   /* ANOMALÍAS REPARABLES */
   get reparableSelected() {
    return this._reparableSelected;
  }

  set reparableSelected(value: boolean[]) {
    this._reparableSelected = value;
    this.reparableSelected$.next(value);
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
