import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilterControlService {
  public minPerdidasDefault: number = 0;
  private _minPerdidas: number = 0;
  public minPerdidasSource = new BehaviorSubject<number>(this._minPerdidas);
  public maxPerdidasDefault: number = 100;
  private _maxPerdidas: number = 100;
  public maxPerdidasSource = new BehaviorSubject<number>(this._maxPerdidas);

  public minTempMaxDefault: number = 50;
  private _minTempMax: number = 50;
  public minTempMaxSource = new BehaviorSubject<number>(this._minTempMax);
  public maxTempMaxDefault: number = 100;
  private _maxTempMax: number = 100;
  public maxTempMaxSource = new BehaviorSubject<number>(this._maxTempMax);

  public minGradienteDefault: number = 0;
  private _minGradiente: number = 0;
  public minGradienteSource = new BehaviorSubject<number>(this._minGradiente);
  public maxGradienteDefault: number = 50;
  private _maxGradiente: number = 50;
  public maxGradienteSource = new BehaviorSubject<number>(this._maxGradiente);

  private _labelTipoDefaultStatus = true;
  public labelTipoDefaultStatus$ = new BehaviorSubject<boolean>(this._labelTipoDefaultStatus);
  public selectedTipoDefaultLabel = 'Tipo de anomalía';
  private _selectedTipoLabels: string[] = [this.selectedTipoDefaultLabel];
  public selectedTipoLabels$ = new BehaviorSubject<string[]>(this._selectedTipoLabels);
  public tiposSelectedDefault: boolean[] = [];
  private _tiposSelected: boolean[] = [];
  public tiposSelected$ = new BehaviorSubject<boolean[]>(this._tiposSelected);

  private _severidadSelected: string[] = [];
  public severidadSelected$ = new BehaviorSubject<string[]>(this._severidadSelected);

  constructor() {}

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
    this.maxPerdidasSource.next(value);
  }

  /* TEMPERATURA MAXIMA */
  get minTempMax() {
    return this._minTempMax;
  }

  set minTempMax(value: number) {
    this._minTempMax = value;
    this.minTempMaxSource.next(value);
  }

  get maxTempMax() {
    return this._maxTempMax;
  }

  set maxTempMax(value: number) {
    this._maxTempMax = value;
    this.maxTempMaxSource.next(value);
  }

  /* GRADIENTE NORMALIZADO */
  get minGradiente() {
    return this._minGradiente;
  }

  set minGradiente(value: number) {
    this._minGradiente = value;
    this.minGradienteSource.next(value);
  }

  get maxGradiente() {
    return this._maxGradiente;
  }

  set maxGradiente(value: number) {
    this._maxGradiente = value;
    this.maxGradienteSource.next(value);
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

  /* SEVERIDAD */
  get severidadSelected() {
    return this._severidadSelected;
  }

  set severidadSelected(value: string[]) {
    this._severidadSelected = value;
    this.severidadSelected$.next(value);
  }
}
