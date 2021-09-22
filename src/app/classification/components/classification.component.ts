import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { switchMap, take } from 'rxjs/operators';

import { MatSnackBar } from '@angular/material/snack-bar';

import { ClassificationService } from '@core/services/classification.service';
import { ClustersService } from '@core/services/clusters.service';
import { InformeService } from '@core/services/informe.service';
import { StructuresService } from '@core/services/structures.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { ThermalLayerInterface } from '@core/models/thermalLayer';

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
  numAnomsNoModule = 0;
  numAnomsNoGlobals = 0;
  anomsDisconnected: Anomalia[] = [];
  private normModules: NormalizedModule[];
  private thermalLayer: ThermalLayerInterface;

  constructor(
    private classificationService: ClassificationService,
    private clustersService: ClustersService,
    private informeService: InformeService,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    private structuresService: StructuresService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.classificationService.initService().then((value) => (this.serviceInit = value));
    this.classificationService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
    this.classificationService.normModHovered$.subscribe((normMod) => (this.normModHovered = normMod));

    // lo iniciamos para poder acceder a la info de la trayectoria del vuelo
    this.clustersService.initService().pipe(take(1)).subscribe();

    this.classificationService.normModules$
      .pipe(
        switchMap((normMods) => {
          this.normModules = normMods;

          // nos suscribimos a las anomalias
          return this.classificationService.listaAnomalias$;
        })
      )
      .subscribe((anomalias) => {
        this.anomalias = anomalias;

        if (anomalias !== undefined) {
          this.anomaliasNoData = anomalias.filter(
            (anom) => anom.gradienteNormalizado === 0 || anom.temperaturaMax === 0
          );
          this.numAnomsNoModule = anomalias.filter((anom) => anom.modulo === null).length;
          this.numAnomsNoGlobals = anomalias.filter((anom) => anom.globalCoords[0] === null).length;
          const normModsIds = this.normModules.map((normMod) => normMod.id);
          this.anomsDisconnected = anomalias.filter((anom) => !normModsIds.includes(anom.id));
        }
      });

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

    // aviso de proceso terminado
    this.openSnackBar();
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

    this.anomalias.forEach((anom) => {
      const params = new HttpParams().set('anomaliaId', anom.id);

      return this.http
        .get(url, { responseType: 'text', params })
        .toPromise()
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  updateAnomaliasNoData() {
    const url = `https://europe-west1-sdweb-d33ce.cloudfunctions.net/datos_anomalia`;

    this.anomaliasNoData.forEach((anom) => {
      const params = new HttpParams().set('anomaliaId', anom.id);

      return this.http
        .get(url, { responseType: 'text', params })
        .toPromise()
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    });
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

  private openSnackBar() {
    this._snackBar.open('!CLASIFICACIÓN TERMINADA!', 'OK', { duration: 5000, verticalPosition: 'top' });
  }
}
