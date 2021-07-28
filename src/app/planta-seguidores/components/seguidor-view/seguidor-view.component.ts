import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { ReportControlService } from '@core/services/report-control.service';

import { Seguidor } from '@core/models/seguidor';
@Component({
  selector: 'app-seguidor-view',
  templateUrl: './seguidor-view.component.html',
  styleUrls: ['./seguidor-view.component.css'],
})
export class SeguidorViewComponent implements OnInit, OnDestroy {
  public seguidorSelected: Seguidor = undefined;
  numAnomalias: number;
  oneReport = true;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
        this.seguidorSelected = seguidor;

        if (this.seguidorSelected !== undefined) {
          // tslint:disable-next-line: triple-equals
          this.numAnomalias = this.seguidorSelected.anomalias.filter((anom) => anom.tipo != 0).length;

          if (this.numAnomalias > 0) {
            this.seguidorViewService.anomaliaSelected = this.seguidorSelected.anomalias[0];
          }
        }
      })
    );

    if (this.reportControlService.informesIdList.length > 1) {
      this.oneReport = false;
    }
  }

  public closeSidenav() {
    this.seguidorViewService.closeSidenav();

    this.seguidorViewService.imageCanvas.clear();
  }

  nextSeguidor() {
    // limpiamos la imagen del seguidor anterior
    this.seguidorViewService.imageCanvas.clear();
    // reiniciamos la carga de la nueva imagen
    this.seguidorViewService.imageLoaded = false;
    // seleccionamos el proximo seguidor
    this.seguidoresControlService.selectNextSeguidor();
  }

  prevSeguidor() {
    // limpiamos la imagen del seguidor anterior
    this.seguidorViewService.imageCanvas.clear();
    // reiniciamos la carga de la nueva imagen
    this.seguidorViewService.imageLoaded = false;
    // seleccionamos el seguidor previo
    this.seguidoresControlService.selectPrevSeguidor();
  }

  private resetViewValues() {
    this.seguidoresControlService.seguidorSelected = undefined;
    this.seguidorViewService.anomaliaSelected = undefined;
    this.seguidoresControlService.urlVisualImageSeguidor = undefined;
    this.seguidoresControlService.urlThermalImageSeguidor = undefined;
    this.seguidorViewService.imageSelected = undefined;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    // reseteamos los valores
    this.resetViewValues();
  }
}
