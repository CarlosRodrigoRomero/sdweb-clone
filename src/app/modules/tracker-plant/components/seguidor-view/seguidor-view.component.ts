import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { ReportControlService } from '@data/services/report-control.service';

import { Seguidor } from '@core/models/seguidor';
@Component({
  selector: 'app-seguidor-view',
  templateUrl: './seguidor-view.component.html',
  styleUrls: ['./seguidor-view.component.css'],
})
export class SeguidorViewComponent implements OnInit, AfterViewInit, OnDestroy {
  public seguidorSelected: Seguidor = undefined;
  numAnomalias: number;
  imagesExist = [true, true];
  imageSelected = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService,
    public reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
        console.log(seguidor);
        this.seguidorSelected = seguidor;

        if (this.seguidorSelected !== undefined && this.seguidorSelected !== null) {
          this.numAnomalias = this.seguidorSelected.anomaliasCliente.length;
        }
      })
    );

    this.subscriptions.add(this.seguidorViewService.imageSelected$.subscribe((image) => (this.imageSelected = image)));
  }

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.seguidoresControlService.thermalImageExist$.subscribe((exist) => (this.imagesExist[0] = exist))
    );
    this.subscriptions.add(
      this.seguidoresControlService.visualImageExist$.subscribe((exist) => (this.imagesExist[1] = exist))
    );
  }

  resetImages() {
    // limpiamos la imagen del seguidor anterior
    this.seguidorViewService.thermalCanvas.clear();
    this.seguidorViewService.visualCanvas.clear();

    // limpiamos las url para que no se muestre la imagen anterior al pasar
    this.seguidoresControlService.urlThermalImageSeguidor = undefined;
    this.seguidoresControlService.urlVisualImageSeguidor = undefined;

    // reiniciamos la carga de la nueva imagen
    this.seguidorViewService.imagesLoaded = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    // reseteamos los valores
    this.seguidorViewService.resetViewValues();
  }
}
