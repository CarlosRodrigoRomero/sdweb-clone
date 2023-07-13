import { Injectable } from '@angular/core';

import { ReportControlService } from './report-control.service';

import { Anomalia } from '@core/models/anomalia';

import { GLOBAL } from '@data/constants/global';

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  constructor(private reportControlService: ReportControlService) {}

  getNuevasAnomalias(informeId: string): Anomalia[] {
    let anomalias = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informeId);

    GLOBAL.labels_tipos.forEach((label, index) => {
      const anomsTipo = anomalias.filter((anom) => anom.tipo === index);

      if (anomsTipo.length > 0) {
        for (let i = 0; i < Math.floor(anomsTipo.length / 10); i++) {
          const anomalia: Anomalia = {
            tipo: null,
            globalCoords: [''],
            clase: 0,
            perdidas: GLOBAL.pcPerdidas[index],
            gradienteNormalizado: 0,
            temperaturaMax: 0,
            modulo: {},
            temperaturaRef: 0,
            featureCoords: [],
            featureType: '',
            plantaId: '',
            informeId: '',
            tipoNextYear: index,
          };

          anomalias.push(anomalia);
        }
      }
    });

    return anomalias;
  }
}
