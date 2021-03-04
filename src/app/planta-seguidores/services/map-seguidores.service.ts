import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { InformeService } from '@core/services/informe.service';

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

  private _sliderTemporal: number = 100;
  public sliderTemporalSource$ = new BehaviorSubject<number>(this._sliderTemporal);

  private _toggleView = 0;
  public toggleView$ = new BehaviorSubject<number>(this.toggleView);

  private _selectedInformeId: string = '';
  private selectedInformeIdSource = new BehaviorSubject<string>(this._selectedInformeId);
  public selectedInformeId$ = this.selectedInformeIdSource.asObservable();

  constructor(private informeService: InformeService) {}

  initService(plantaId: string) {
    this.plantaId = plantaId;

    this.informeService.getInformesDePlanta(this.plantaId).subscribe((informes) => {
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

  getPlantaId(): Observable<string> {
    return this.plantaId$.asObservable();
  }

  getInformesList(): Observable<string[]> {
    return this.informesList$.asObservable();
  }

  getSliderTemporalSource(): Observable<number> {
    return this.sliderTemporalSource$.asObservable();
  }

  getToggleView(): Observable<number> {
    return this.toggleView$.asObservable();
  }

  get sliderTemporal() {
    return this._sliderTemporal;
  }

  set sliderTemporal(value: number) {
    this._sliderTemporal = value;

    this.sliderTemporalSource$.next(value);
  }
  /////////////////
  get selectedInformeId() {
    return this._selectedInformeId;
  }
  set selectedInformeId(informeId: string) {
    this._selectedInformeId = informeId;

    this.selectedInformeIdSource.next(informeId);
  }
  /////////////////
  get toggleView() {
    return this._toggleView;
  }
  set toggleView(selected: number) {
    this._toggleView = selected;

    this.toggleView$.next(selected);
  }
}
