import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { GLOBAL } from '@core/services/global';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { SeguidorService } from '@core/services/seguidor.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';

import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';

@Component({
  selector: 'app-seguidor-anomalia-info',
  templateUrl: './seguidor-anomalia-info.component.html',
  styleUrls: ['./seguidor-anomalia-info.component.css'],
})
export class SeguidorAnomaliaInfoComponent implements OnInit, OnDestroy {
  anomaliaSelected: Anomalia = undefined;
  anomaliaInfo = {};

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidorViewService: SeguidorViewService,
    private anomaliaService: AnomaliaService,
    private seguidorService: SeguidorService,
    private seguidoresControlService: SeguidoresControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidorViewService.anomaliaSelected$.subscribe((anom) => {
        this.anomaliaSelected = anom;

        if (this.anomaliaSelected !== undefined) {
          this.anomaliaInfo = {
            localId: this.anomaliaSelected.localId,
            clase: GLOBAL.labels_clase[this.anomaliaSelected.clase],
            claseColor: GLOBAL.colores_clase[this.anomaliaSelected.clase],
            temperaturaMax: this.anomaliaSelected.temperaturaMax,
            temperaturaRef: this.anomaliaSelected.temperaturaRef,
            gradienteNormalizado: this.anomaliaSelected.gradienteNormalizado,
            tipo: GLOBAL.pcDescripcion[this.anomaliaSelected.tipo],
            perdidas: this.anomaliaSelected.perdidas,
            causa: GLOBAL.pcCausa[this.anomaliaSelected.tipo],
            recomendacion: GLOBAL.pcRecomendacion[this.anomaliaSelected.tipo],
            fila: this.anomaliaSelected.localY,
            columna: this.anomaliaSelected.localX,
            fecha: this.anomaliaSelected.datetime,
            irradiancia: (this.anomaliaSelected as PcInterface).irradiancia,
            vientoDireccion: this.anomaliaSelected.vientoDireccion,
            vientoVelocidad: this.anomaliaSelected.vientoVelocidad,
            temperaturaAire: (this.anomaliaSelected as PcInterface).temperaturaAire,
            nubosidad: (this.anomaliaSelected as PcInterface).nubosidad,
          };
        }
      })
    );
  }

  downloadRjpg() {
    this.seguidorService.downloadImage('jpg', this.seguidoresControlService.seguidorSelected);
  }

  downloadJpgVisual() {
    this.seguidorService.downloadImage('jpgVisual', this.seguidoresControlService.seguidorSelected);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
