import { Component, OnInit } from '@angular/core';

import { GLOBAL } from '@core/services/global';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';

@Component({
  selector: 'app-seguidor-anomalia-info',
  templateUrl: './seguidor-anomalia-info.component.html',
  styleUrls: ['./seguidor-anomalia-info.component.css'],
})
export class SeguidorAnomaliaInfoComponent implements OnInit {
  anomaliaSelected: Anomalia = undefined;
  anomaliaInfo = {};

  constructor(private seguidorViewService: SeguidorViewService, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.seguidorViewService.anomaliaSelected$.subscribe((anom) => {
      this.anomaliaSelected = anom;

      if (this.anomaliaSelected !== undefined) {
        this.anomaliaInfo = {
          localId: (this.anomaliaSelected as PcInterface).local_id,
          clase: GLOBAL.labels_severidad[this.anomaliaSelected.severidad],
          claseColor: GLOBAL.colores_severidad[this.anomaliaSelected.severidad],
          temperaturaMax: this.anomaliaSelected.temperaturaMax,
          temperaturaRef: this.anomaliaSelected.temperaturaRef,
          gradienteNormalizado: this.anomaliaSelected.gradienteNormalizado,
          tipo: GLOBAL.pcDescripcion[this.anomaliaSelected.tipo],
          causa: GLOBAL.pcCausa[this.anomaliaSelected.tipo],
          recomendacion: GLOBAL.pcRecomendacion[this.anomaliaSelected.tipo],
          fila: (this.anomaliaSelected as PcInterface).local_y,
          columna: (this.anomaliaSelected as PcInterface).local_x,
          fecha: this.anomaliaSelected.datetime,
          irradiancia: (this.anomaliaSelected as PcInterface).irradiancia,
          vientoDireccion: this.anomaliaSelected.vientoDireccion,
          vientoVelocidad: this.anomaliaSelected.vientoVelocidad,
          temperaturaAire: (this.anomaliaSelected as PcInterface).temperaturaAire,
          nubosidad: (this.anomaliaSelected as PcInterface).nubosidad,
        };
      }
    });
  }

  downloadRjpg() {
    this.anomaliaService.downloadRjpg(this.anomaliaSelected);
  }

  downloadJpgVisual() {
    this.anomaliaService.downloadJpgVisual(this.anomaliaSelected);
  }
}
