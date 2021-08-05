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
          this.numAnomalias = this.seguidorSelected.anomaliasCliente.length;

          if (this.numAnomalias > 0) {
            this.seguidorViewService.anomaliaSelected = this.seguidorSelected.anomaliasCliente[0];
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

    // reseteamos los valores de la vista seguidor
    this.seguidorViewService.resetViewValues();
  }

  nextSeguidor() {
    // limpiamos la imagen del seguidor anterior
    this.seguidorViewService.visualCanvas.clear();
    // reiniciamos la carga de la nueva imagen
    this.seguidorViewService.imagesLoaded = false;
    // seleccionamos el proximo seguidor
    this.seguidoresControlService.selectNextSeguidor();
  }

  prevSeguidor() {
    // limpiamos la imagen del seguidor anterior
    this.seguidorViewService.visualCanvas.clear();
    // reiniciamos la carga de la nueva imagen
    this.seguidorViewService.imagesLoaded = false;
    // seleccionamos el seguidor previo
    this.seguidoresControlService.selectPrevSeguidor();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    // reseteamos los valores
    this.seguidorViewService.resetViewValues();
  }
}
