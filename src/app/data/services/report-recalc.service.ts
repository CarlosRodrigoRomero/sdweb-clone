import { Injectable } from '@angular/core';

import { ReportControlService } from './report-control.service';

import { InformeInterface } from '@core/models/informe';

import { GLOBAL } from '@data/constants/global';

@Injectable({
  providedIn: 'root',
})
export class ReportRecalcService {
  constructor(private reportControlService: ReportControlService) {}

  recalMAEyCC(informe: InformeInterface) {
    // calculamos MAE
    const anomaliasInforme = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informe.id);
    this.reportControlService.setMae(anomaliasInforme, informe);

    // calculamos MAE reparable
    const fixableAnoms = anomaliasInforme.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));
    this.reportControlService.setMae(fixableAnoms, informe, 'fixablePower');

    this.reportControlService.setCC(anomaliasInforme, informe);
  }
}
