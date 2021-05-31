import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { Feature } from 'ol';
import SimpleGeometry from 'ol/geom/SimpleGeometry';

import { InformeService } from './informe.service';
import { PlantaService } from './planta.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { PlantaInterface } from '@core/models/planta';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';

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
  private _normModSelected: NormalizedModule = undefined;
  normModSelected$ = new BehaviorSubject<NormalizedModule>(this._normModSelected);
  private _anomalia = undefined;
  anomalia$ = new BehaviorSubject<Anomalia>(this._anomalia);

  constructor(
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private anomaliaService: AnomaliaService
  ) {}

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

        // preparamos las locAreas para luego calcular las globalCoords de las nuevas anomalias
        this.plantaService.setLocAreaListFromPlantaIdOl(this.planta.id);

        this.initialized$.next(true);
      });

    return this.initialized$;
  }

  createAnomaliaFromNormModule(feature: Feature) {
    const geometry = feature.getGeometry() as SimpleGeometry;
    const globalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(geometry.getCoordinates()[0][0]);

    const anomalia: Anomalia = {
      id: feature.getProperties().properties.id,
      plantaId: this.planta.id,
      informeId: this.informeId,
      tipo: 50, // CONECTAR AL FORMULARIO
      globalCoords,
      severidad: 50,
      perdidas: 0,
      gradienteNormalizado: 0,
      temperaturaMax: 0,
      modulo: null,
      temperaturaRef: 0,
      featureCoords: geometry.getCoordinates()[0],
      featureType: geometry.getType(),
    };
    // asignamos la nueva anomalia para acceder a ella y poder modificarla
    this.anomalia = anomalia;

    // Guardar en la base de datos
    this.anomaliaService.addAnomalia(anomalia);
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

  get normModSelected() {
    return this._normModSelected;
  }

  set normModSelected(value: NormalizedModule) {
    this._normModSelected = value;
    this.normModSelected$.next(value);
  }

  get anomalia() {
    return this._anomalia;
  }

  set anomalia(value: Anomalia) {
    this._anomalia = value;
    this.anomalia$.next(value);
  }
}
