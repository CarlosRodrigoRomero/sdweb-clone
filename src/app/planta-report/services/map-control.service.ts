import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { InformeService } from '@core/services/informe.service';

@Injectable({
  providedIn: 'root',
})
export class MapControlService {
  private informesList: string[] = [];
  public informesList$ = new BehaviorSubject<string[]>(this.informesList);

  private initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this.initialized);

  private _sliderMin: number = 25;
  public sliderMinSource = new BehaviorSubject<number>(this._sliderMin);

  private _sliderMax: number = 70;
  public sliderMaxSource = new BehaviorSubject<number>(this._sliderMax);

  private _sliderTemporal: number = 100;
  public sliderTemporalSource = new BehaviorSubject<number>(this._sliderTemporal);

  private _sliderThermalOpacity: number = 100;
  public sliderThermalOpacitySource = new BehaviorSubject<number>(this._sliderThermalOpacity);

  private _selectedInformeId: string = undefined;
  private selectedInformeIdSource = new BehaviorSubject<string>(this._selectedInformeId);
  public selectedInformeId$ = this.selectedInformeIdSource.asObservable();

  constructor(private informeService: InformeService) {}

  initService(plantaId: string) {
    this.informeService.getInformesDePlanta(plantaId).subscribe((informes) => {
      // los ordenamos de menos a mas reciente y los añadimos a la lista
      informes
        .sort((a, b) => a.fecha - b.fecha)
        .forEach((informe) => {
          this.informesList.push(informe.id);
        });
      this.informesList$.next(this.informesList);

      // indicamos el informe seleccionado
      this._selectedInformeId = this.informesList[this.informesList.length];
      this.selectedInformeIdSource.next(this._selectedInformeId);

      this.initialized$.next(true);
    });

    return this.initialized$;
  }

  /////////////////
  get sliderMin() {
    return this._sliderMin;
  }
  set sliderMin(value: number) {
    this._sliderMin = value;
    this.sliderMaxSource.next(value);
  }
  /////////////////
  get sliderMax() {
    return this._sliderMax;
  }
  set sliderMax(value: number) {
    this._sliderMax = value;

    this.sliderMinSource.next(value);
  }
  /////////////////
  get sliderTemporal() {
    return this._sliderTemporal;
  }
  set sliderTemporal(value: number) {
    this._sliderTemporal = value;

    this.sliderTemporalSource.next(value);
  }
  /////////////////
  get sliderThermalOpacity() {
    return this._sliderThermalOpacity;
  }
  set sliderThermalOpacity(value: number) {
    this._sliderThermalOpacity = value;

    this.sliderThermalOpacitySource.next(value);
  }
  /////////////////
  get selectedInformeId() {
    return this._selectedInformeId;
  }
  set selectedInformeId(informeId: string) {
    this._selectedInformeId = informeId;

    this.selectedInformeIdSource.next(informeId);
  }
}
