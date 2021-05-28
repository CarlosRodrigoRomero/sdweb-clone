import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';

import { InformeService } from './informe.service';
import { PlantaService } from './planta.service';

import { PlantaInterface } from '@core/models/planta';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { switchMap, take } from 'rxjs/operators';
import { Structure } from '@core/models/structure';
import { NormalizedModule } from '@core/models/normalizedModule';

@Injectable({
  providedIn: 'root',
})
export class ClassificationService {
  private _informeId: string;
  private _planta: PlantaInterface = {};
  planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  private _thermalLayer: ThermalLayerInterface;
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private _modNormSelected: NormalizedModule = undefined;
  modNormSelected$ = new BehaviorSubject<NormalizedModule>(this._modNormSelected);

  constructor(private router: Router, private informeService: InformeService, private plantaService: PlantaService) {}

  initService(): Observable<boolean> {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    this.informeService
      .getInforme(this.informeId)
      .pipe(
        take(1),
        switchMap((informe) => this.plantaService.getPlanta(informe.plantaId))
      )
      .pipe(
        take(1),
        switchMap((planta) => {
          this.planta = planta;

          return this.informeService.getThermalLayer$(this.informeId);
        })
      )
      .subscribe((layers) => {
        this.thermalLayer = layers[0];

        this.initialized$.next(true);
      });
    return this.initialized$;
  }

  get informeId() {
    return this._informeId;
  }

  set informeId(value: string) {
    this._informeId = value;
  }

  get planta() {
    return this._planta;
  }

  set planta(value: PlantaInterface) {
    this._planta = value;
    this.planta$.next(value);
  }

  get thermalLayer() {
    return this._thermalLayer;
  }

  set thermalLayer(value: ThermalLayerInterface) {
    this._thermalLayer = value;
  }

  get modNormSelected() {
    return this._modNormSelected;
  }

  set modNormSelected(value: NormalizedModule) {
    this._modNormSelected = value;
    this.modNormSelected$.next(value);
  }
}
