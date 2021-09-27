import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { take } from 'rxjs/operators';

import { ThemePalette } from '@angular/material/core';
import { ProgressBarMode } from '@angular/material/progress-bar';

import { ClassificationService } from '@core/services/classification.service';
import { ClustersService } from '@core/services/clusters.service';
import { InformeService } from '@core/services/informe.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';

import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { Coordinate } from 'ol/coordinate';

@Component({
  selector: 'app-classification',
  templateUrl: './classification.component.html',
  styleUrls: ['./classification.component.css'],
})
export class ClassificationComponent implements OnInit {
  serviceInit = false;
  nombrePlanta: string;
  normModHovered: NormalizedModule = undefined;
  private anomalias: Anomalia[] = [];
  private informe: InformeInterface;
  anomaliasNoData: Anomalia[] = [];
  anomsNoModule: Anomalia[] = [];
  anomsNoGlobals: Anomalia[] = [];
  anomsDisconnected: Anomalia[] = [];
  private normModules: NormalizedModule[];
  processing = false;
  progressBarColor: ThemePalette = 'primary';
  progressBarMode: ProgressBarMode = 'determinate';
  progressBarValue = 0;

  constructor(
    private classificationService: ClassificationService,
    private clustersService: ClustersService,
    private informeService: InformeService,
    private http: HttpClient,
    private anomaliaService: AnomaliaService,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    this.classificationService.initService().then((value) => (this.serviceInit = value));
    this.classificationService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
    this.classificationService.normModHovered$.subscribe((normMod) => (this.normModHovered = normMod));

    // lo iniciamos para poder acceder a la info de la trayectoria del vuelo
    this.clustersService.initService().pipe(take(1)).subscribe();

    this.classificationService.normModules$.subscribe((normMods) => (this.normModules = normMods));

    this.classificationService.listaAnomalias$.subscribe((anomalias) => (this.anomalias = anomalias));

    // traemos el informe
    this.informeService
      .getInforme(this.classificationService.informeId)
      .subscribe((informe) => (this.informe = informe));
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
    this.informe.disponible = true;

    // actualizamos el informe en la DB
    this.informeService.updateInforme(this.informe);
  }

  private updateAnomalias() {
    const url = `https://europe-west1-sdweb-d33ce.cloudfunctions.net/datos_anomalia`;

    this.processing = true;

    let count = 0;
    this.progressBarValue = 0;

    this.anomalias.forEach((anom) => {
      const params = new HttpParams().set('anomaliaId', anom.id);

      return this.http
        .get(url, { responseType: 'text', params })
        .toPromise()
        .then((res) => {
          count++;
          this.progressBarValue = Math.round((count / this.anomalias.length) * 100);
          if (count === this.anomalias.length) {
            this.processing = false;

            this.syncAnomsState();
          }
        })
        .catch((err) => {
          console.log('Error al actualizar anomalia ' + anom.id);

          count++;
          this.progressBarValue = Math.round((count / this.anomalias.length) * 100);
          if (count === this.anomalias.length) {
            this.processing = false;

            this.syncAnomsState();
          }
        });
    });
  }

  updateAnomaliasNoData() {
    const url = `https://europe-west1-sdweb-d33ce.cloudfunctions.net/datos_anomalia`;

    this.processing = true;

    let count = 0;
    this.progressBarValue = 0;

    this.anomaliasNoData.forEach((anom) => {
      const params = new HttpParams().set('anomaliaId', anom.id);

      return this.http
        .get(url, { responseType: 'text', params })
        .toPromise()
        .then((res) => {
          count++;
          this.progressBarValue = Math.round((count / this.anomaliasNoData.length) * 100);

          // al terminar...
          if (count === this.anomaliasNoData.length) {
            this.processing = false;

            this.syncAnomsState();
          }
        })
        .catch((err) => {
          console.log('Error al actualizar anomalia ' + anom.id);

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
        const newGloblaCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(coordCentroid);

        this.anomaliaService.updateAnomaliaField(anom.id, 'globalCoords', newGloblaCoords);

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
      const modulo = this.classificationService.getAnomModule(anom.featureCoords[0]);
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
    const anomalias = this.classificationService.listaAnomalias;

    if (anomalias !== undefined) {
      this.anomaliasNoData = anomalias.filter((anom) => anom.gradienteNormalizado === 0 || anom.temperaturaMax === 0);
      this.anomsNoModule = anomalias.filter((anom) => anom.modulo === null);
      this.anomsNoGlobals = anomalias.filter((anom) => anom.globalCoords[0] === null);
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
}
