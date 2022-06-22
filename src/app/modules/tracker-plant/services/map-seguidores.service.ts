import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { InformeService } from '@data/services/informe.service';

@Injectable({
  providedIn: 'root',
})
export class MapSeguidoresService {
  private plantaId = '';
  private plantaId$ = new BehaviorSubject<string>(this.plantaId);

  private informesList: string[] = [];
  private informesList$ = new BehaviorSubject<string[]>(this.informesList);

  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);

  private _sliderTemporalSelected: number = 100;
  public sliderTemporalSelected$ = new BehaviorSubject<number>(this._sliderTemporalSelected);

  private _sliderOpacity: number = 100;
  public sliderOpacity$ = new BehaviorSubject<number>(this._sliderOpacity);

  private _toggleViewSelected = 0;
  public toggleViewSelected$ = new BehaviorSubject<number>(this._toggleViewSelected);

  constructor(private informeService: InformeService) {}

  initService(plantaId: string) {
    this.plantaId = plantaId;

    this.informeService.getInformesDisponiblesDePlanta(this.plantaId).subscribe((informes) => {
      // los ordenamos de menos a mas reciente y los añadimos a la lista
      informes
        .sort((a, b) => a.fecha - b.fecha)
        .forEach((informe) => {
          this.informesList.push(informe.id);
        });
      this.informesList$.next(this.informesList);

      this.initialized$.next(true);
    });

    return this.initialized$;
  }

  resetService() {
    this.plantaId = '';
    this.informesList = [];
    this._sliderTemporalSelected = 100;
    this._sliderOpacity = 100;
    this._toggleViewSelected = 0;
  }

  getPlantaId(): Observable<string> {
    return this.plantaId$.asObservable();
  }

  getInformesList(): Observable<string[]> {
    return this.informesList$.asObservable();
  }

  get sliderTemporalSelected() {
    return this._sliderTemporalSelected;
  }

  set sliderTemporalSelected(value: number) {
    this._sliderTemporalSelected = value;
    this.sliderTemporalSelected$.next(value);
  }

  get toggleViewSelected() {
    return this._toggleViewSelected;
  }

  set toggleViewSelected(selected: number) {
    this._toggleViewSelected = selected;
    this.toggleViewSelected$.next(selected);
  }

  get sliderOpacity() {
    return this._sliderOpacity;
  }

  set sliderOpacity(value: number) {
    this._sliderOpacity = value;
    this.sliderOpacity$.next(value);
  }
}
