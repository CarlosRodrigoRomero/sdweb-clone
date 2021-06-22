import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFirestore } from '@angular/fire/firestore';

import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { Feature, Map } from 'ol';
import SimpleGeometry from 'ol/geom/SimpleGeometry';

import { InformeService } from './informe.service';
import { PlantaService } from './planta.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { OlMapService } from '@core/services/ol-map.service';

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
  private map: Map;
  private _normModSelected: NormalizedModule = undefined;
  normModSelected$ = new BehaviorSubject<NormalizedModule>(this._normModSelected);
  private _normModHovered: NormalizedModule = undefined;
  normModHovered$ = new BehaviorSubject<NormalizedModule>(this._normModHovered);
  private _anomaliaSelected: Anomalia = undefined;
  anomaliaSelected$ = new BehaviorSubject<Anomalia>(this._anomaliaSelected);
  private _listaAnomalias: Anomalia[] = undefined;
  listaAnomalias$ = new BehaviorSubject<Anomalia[]>(this._listaAnomalias);

  constructor(
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private anomaliaService: AnomaliaService,
    private afs: AngularFirestore,
    private olMapService: OlMapService
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

          return this.informeService.getThermalLayerDB$(this.informeId);
        })
      )
      .subscribe((layers) => {
        this.thermalLayer = layers[0];

        // preparamos las locAreas para luego calcular las globalCoords de las nuevas anomalias
        this.plantaService.setLocAreaListFromPlantaIdOl(this.planta.id);

        // nos suscribimos a la lista de anomalias
        this.anomaliaService.getAnomaliasInforme$(this.informeId).subscribe((anoms) => (this.listaAnomalias = anoms));

        this.initialized$.next(true);
      });

    this.olMapService.map$.subscribe((map) => (this.map = map));

    return this.initialized$;
  }

  createAnomaliaFromNormModule(feature: Feature, date: number) {
    const id = feature.getProperties().properties.id;
    const refAnom = this.afs.collection('anomalias').doc(id);
    const normModule = feature.getProperties().properties.normMod;

    refAnom
      .get()
      .toPromise()
      .then((anom) => {
        // comprobamos si la anomalia existe
        if (anom.exists) {
          // si existe la traemos para leer sus datos
          this.anomaliaService.getAnomalia(id).subscribe((anomalia) => (this.anomaliaSelected = anomalia));
        } else {
          // si no existe previmente la creamos
          const geometry = feature.getGeometry() as SimpleGeometry;
          const globalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(geometry.getCoordinates()[0][0]);

          const anomalia: Anomalia = {
            id,
            plantaId: this.planta.id,
            informeId: this.informeId,
            tipo: 8,
            globalCoords,
            gradienteNormalizado: 0,
            temperaturaMax: 0,
            modulo: null,
            featureCoords: geometry.getCoordinates()[0],
            featureType: geometry.getType(),
            localX: normModule.columna,
            localY: normModule.fila,
            datetime: date,
          };
          // asignamos la nueva anomalia para acceder a ella y poder modificarla
          this.anomaliaSelected = anomalia;

          // Guardar en la base de datos
          this.anomaliaService.addAnomalia(anomalia);
        }
      });
  }

  hidePopup() {
    this.map.getOverlayById('popup').setPosition(undefined);
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

  get anomaliaSelected() {
    return this._anomaliaSelected;
  }

  set anomaliaSelected(value: Anomalia) {
    this._anomaliaSelected = value;
    this.anomaliaSelected$.next(value);
  }

  get normModHovered() {
    return this._normModHovered;
  }

  set normModHovered(value: NormalizedModule) {
    this._normModHovered = value;
    this.normModHovered$.next(value);
  }

  get listaAnomalias() {
    return this._listaAnomalias;
  }

  set listaAnomalias(value: Anomalia[]) {
    this._listaAnomalias = value;
    this.listaAnomalias$.next(value);
  }
}
