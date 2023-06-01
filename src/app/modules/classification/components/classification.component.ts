import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';

import { ThemePalette } from '@angular/material/core';
import { ProgressBarMode } from '@angular/material/progress-bar';

import { Coordinate } from 'ol/coordinate';

import { ClassificationService } from '@data/services/classification.service';
import { ClustersService } from '@data/services/clusters.service';
import { InformeService } from '@data/services/informe.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PlantaService } from '@data/services/planta.service';
import { WarningService } from '@data/services/warning.service';
import { OlMapService } from '@data/services/ol-map.service';

import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { Warning } from '@shared/components/warnings-menu/warnings';
import { LocationAreaInterface } from '@core/models/location';

@Component({
  selector: 'app-classification',
  templateUrl: './classification.component.html',
  styleUrls: ['./classification.component.css'],
})
export class ClassificationComponent implements OnInit, OnDestroy {
  serviceInit = false;
  planta: PlantaInterface;
  normModHovered: NormalizedModule = undefined;
  private anomalias: Anomalia[] = [];
  informe: InformeInterface;
  anomaliasNoData: Anomalia[] = [];
  anomsNoModule: Anomalia[] = [];
  anomsNoGlobals: Anomalia[] = [];
  anomsDisconnected: Anomalia[] = [];
  private normModules: NormalizedModule[];
  private _anomsProcesed = false;
  private anomsProcesed$ = new BehaviorSubject<boolean>(this._anomsProcesed);
  processing = false;
  progressBarColor: ThemePalette = 'primary';
  progressBarMode: ProgressBarMode = 'determinate';
  progressBarValue = 0;
  everSynced = false;
  private warnings: Warning[] = [];
  private locAreas: LocationAreaInterface[] = [];
  private realAnoms: Anomalia[] = [];
  informeId: string;
  private urlCalcAnomData = 'https://datos-anomalia-rcpywurt6q-ew.a.run.app';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private classificationService: ClassificationService,
    private clustersService: ClustersService,
    private informeService: InformeService,
    private http: HttpClient,
    private anomaliaService: AnomaliaService,
    private plantaService: PlantaService,
    private warningService: WarningService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.classificationService.initService().then((value) => {
      this.serviceInit = value;

      this.informeId = this.classificationService.informeId;
    });
    this.subscriptions.add(this.classificationService.planta$.subscribe((planta) => (this.planta = planta)));
    this.subscriptions.add(
      this.classificationService.normModHovered$.subscribe((normMod) => (this.normModHovered = normMod))
    );

    // lo iniciamos para poder acceder a la info de la trayectoria del vuelo
    this.subscriptions.add(this.clustersService.initService().pipe(take(1)).subscribe());

    this.subscriptions.add(
      this.classificationService.normModules$.subscribe((normMods) => (this.normModules = normMods))
    );

    this.subscriptions.add(
      this.classificationService.listaAnomalias$.subscribe((anomalias) => (this.anomalias = anomalias))
    );

    // traemos el informe
    this.informeService
      .getInforme(this.classificationService.informeId)
      .pipe(take(1))
      .subscribe((informe) => (this.informe = informe));

    this.subscriptions.add(
      this.anomsProcesed$.subscribe((procesed) => {
        if (procesed) {
          this.loadDataAndCheckWarnings();
        }
      })
    );
  }

  endClassification() {
    // actualizamos el informe con los datos que le faltan
    this.updateInforme();
    // actualizamos las anomalias con los datos que les faltan
    this.updateAnomalias();
  }

  private updateInforme() {
    this.informe.mae = this.getMaeInforme();
    this.informe.cc = this.getCCInforme();

    // actualizamos el informe en la DB
    this.informeService.updateInforme(this.informe);
  }

  private updateAnomalias() {
    this.processing = true;

    let count = 0;
    this.progressBarValue = 0;

    this.anomalias.forEach((anom) => {
      const params = new HttpParams().set('anomaliaId', anom.id);

      return this.http
        .get(this.urlCalcAnomData, { responseType: 'text', params })
        .toPromise()
        .then((res) => {
          console.log(res);

          count++;
          this.progressBarValue = Math.round((count / this.anomalias.length) * 100);
          if (count === this.anomalias.length) {
            this.anomsProcesed = true;

            this.syncAnomsState();
          }
        })
        .catch((err) => {
          console.log(err);

          count++;
          this.progressBarValue = Math.round((count / this.anomalias.length) * 100);
          if (count === this.anomalias.length) {
            this.anomsProcesed = true;

            this.syncAnomsState();
          }
        });
    });
  }

  updateAnomaliasNoData() {
    this.processing = true;

    let count = 0;
    this.progressBarValue = 0;

    this.anomaliasNoData.forEach((anom, index) => {
      const params = new HttpParams().set('anomaliaId', anom.id);

      return this.http
        .get(this.urlCalcAnomData, { responseType: 'text', params })
        .toPromise()
        .then((res) => {
          console.log(res);

          count++;
          this.progressBarValue = Math.round((count / this.anomaliasNoData.length) * 100);

          // al terminar...
          if (count === this.anomaliasNoData.length) {
            this.processing = false;

            this.syncAnomsState();
          }
        })
        .catch((err) => {
          console.log(err);

          count++;
          this.progressBarValue = Math.round((count / this.anomaliasNoData.length) * 100);

          // al terminar...
          if (count === this.anomaliasNoData.length) {
            this.processing = false;

            this.syncAnomsState();
          }
        });
    });
  }

  updateGlobalCoordsAnoms(check: boolean) {
    this.processing = true;

    let count = 0;
    this.progressBarValue = 0;

    let anomalias = this.classificationService.listaAnomalias;
    if (check) {
      anomalias = this.anomsNoGlobals;
    }

    anomalias.forEach((anom) => {
      let coordObj = this.normModules.find((nM) => nM.id === anom.id).centroid_gps;
      if (coordObj === undefined) {
        coordObj = this.normModules.find((nM) => nM.id === anom.id).coords.bottomLeft;
      }

      if (coordObj !== undefined) {
        const coordCentroid = [coordObj.long, coordObj.lat] as Coordinate;
        const newGlobalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(coordCentroid);

        this.anomaliaService.updateAnomaliaField(anom.id, 'globalCoords', newGlobalCoords);

        count++;
        this.progressBarValue = Math.round((count / anomalias.length) * 100);

        // al terminar...
        if (count === anomalias.length) {
          this.processing = false;

          this.syncAnomsState();
        }
      }
    });
  }

  updateModuleAnoms(check: boolean) {
    this.processing = true;

    let count = 0;
    this.progressBarValue = 0;

    let anomalias = this.classificationService.listaAnomalias;
    if (check) {
      anomalias = this.anomsNoModule;
    }

    anomalias.forEach((anom) => {
      const modulo = this.classificationService.getAnomModule(this.olMapService.getCentroid(anom.featureCoords));
      if (modulo !== undefined) {
        this.anomaliaService.updateAnomaliaField(anom.id, 'modulo', modulo);

        count++;
        this.progressBarValue = Math.round((count / anomalias.length) * 100);

        // al terminar...
        if (count === anomalias.length) {
          this.processing = false;

          this.syncAnomsState();
        }
      }
    });
  }

  syncAnomsState() {
    // actualizamos las anomalias por si ha habido cambios
    this.classificationService.getAnomalias();

    const anomalias = this.classificationService.listaAnomalias;

    if (anomalias !== undefined) {
      this.everSynced = true;
      this.anomaliasNoData = anomalias.filter((anom) => anom.gradienteNormalizado === 0 || anom.temperaturaMax === 0);
      if (this.anomaliasNoData.length > 0) {
        console.log('Anomalías sin datos');
        console.log(this.anomaliasNoData);
      }
      this.anomsNoModule = anomalias.filter((anom) => anom.modulo === null);
      if (this.anomaliasNoData.length === 0 && this.anomsNoModule.length > 0) {
        console.log('Anomalías sin modulo');
        console.log(this.anomsNoModule);
      }
      this.anomsNoGlobals = anomalias.filter((anom) => anom.globalCoords[0] === null);
      if (this.anomaliasNoData.length === 0 && this.anomsNoGlobals.length > 0) {
        console.log('Anomalías sin globalCoords');
        console.log(this.anomsNoGlobals);
      }
      const normModsIds = this.normModules.map((normMod) => normMod.id);
      this.anomsDisconnected = anomalias.filter((anom) => !normModsIds.includes(anom.id));
    }
  }

  deleteDisconnectedAnoms() {
    this.anomsDisconnected.forEach((anom) => this.anomaliaService.deleteAnomalia(anom));
  }

  private getMaeInforme(): number {
    const perdidas = this.anomalias.map((anom) => anom.perdidas);
    let perdidasTotales = 0;
    perdidas.forEach((perd) => (perdidasTotales += perd));

    return perdidasTotales / this.informe.numeroModulos;
  }

  private getCCInforme(): number {
    // tslint:disable-next-line: triple-equals
    const celCals = this.anomalias.filter((anom) => anom.tipo == 8 || anom.tipo == 9);

    return celCals.length / this.informe.numeroModulos;
  }

  private loadDataAndCheckWarnings() {
    combineLatest([
      this.informeService.getInforme(this.classificationService.informeId),
      this.warningService.getWarnings(this.classificationService.informeId),
    ])
      .pipe(
        take(1),
        switchMap(([informe, warnings]) => {
          this.informe = informe;
          this.warnings = warnings;

          return this.plantaService.getPlanta(informe.plantaId);
        }),
        take(1),
        switchMap((planta) => {
          this.planta = planta;

          return this.plantaService.getLocationsArea(planta.id);
        }),
        take(1)
      )
      .subscribe((locAreas) => {
        this.locAreas = locAreas;

        this.anomaliaService.initService(this.planta.id).then(() => {
          this.anomaliaService
            .getAnomalias$(this.classificationService.informeId, 'anomalias')
            .pipe(take(1))
            .subscribe((anoms) => {
              this.realAnoms = this.anomaliaService.getRealAnomalias(anoms);

              this.processing = !this.warningService.checkWarnings(
                this.informe,
                this.realAnoms,
                this.warnings,
                this.planta,
                this.locAreas
              );
            });
        });
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  get anomsProcesed() {
    return this._anomsProcesed;
  }

  set anomsProcesed(value: boolean) {
    this._anomsProcesed = value;
    this.anomsProcesed$.next(value);
  }
}
