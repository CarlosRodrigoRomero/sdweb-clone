import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import { MatSnackBar } from '@angular/material/snack-bar';

import { ClassificationService } from '@core/services/classification.service';
import { ClustersService } from '@core/services/clusters.service';
import { InformeService } from '@core/services/informe.service';

import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';

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

  constructor(
    private classificationService: ClassificationService,
    private clustersService: ClustersService,
    private informeService: InformeService,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.classificationService.initService().subscribe((value) => (this.serviceInit = value));
    this.classificationService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
    this.classificationService.normModHovered$.subscribe((normMod) => (this.normModHovered = normMod));

    // lo iniciamos para poder acceder a la info de la trayectoria del vuelo
    this.clustersService.initService().pipe(take(1)).subscribe();

    // nos suscribimos a las anomalias
    this.classificationService.listaAnomalias$.subscribe((anomalias) => (this.anomalias = anomalias));

    // traemos el informe
    this.informeService
      .getInforme(this.classificationService.informeId)
      .subscribe((informe) => (this.informe = informe));
  }

  endClassification() {
    this.informe.mae = this.getMaeInforme();
    this.informe.pc_pct = this.getCCInforme();

    // actualizamos el informe en la DB
    this.informeService.updateInforme(this.informe);

    // aviso de proceso terminado
    this.openSnackBar();
  }

  private getMaeInforme() {
    const perdidas = this.anomalias.map((anom) => anom.perdidas);
    let perdidasTotales = 0;
    perdidas.forEach((perd) => (perdidasTotales += perd));

    return perdidasTotales / this.informe.numeroModulos;
  }

  private getCCInforme() {
    const celCals = this.anomalias.filter((anom) => anom.tipo === 8 || anom.tipo === 9);

    return celCals.length / this.informe.numeroModulos;
  }

  private openSnackBar() {
    this._snackBar.open('!CLASIFICACIÓN TERMINADA!', 'OK', { duration: 5000, verticalPosition: 'top' });
  }
}
