import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { formatNumber, formatDate } from '@angular/common';

import { AnomaliaService } from '@core/services/anomalia.service';
import { ReportControlService } from '@core/services/report-control.service';
import { GLOBAL } from './global';

import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaInfoService {
  private selectedInforme: InformeInterface;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private anomaliaService: AnomaliaService,
    private reportControlService: ReportControlService
  ) {
    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInforme = this.reportControlService.informes.find((informe) => informe.id === informeId);
    });
  }

  getTipoLabel(anomalia: Anomalia): string {
    return GLOBAL.labels_tipos[anomalia.tipo];
  }

  getCausa(anomalia: Anomalia): string {
    return GLOBAL.pcCausa[anomalia.tipo];
  }

  getRecomendacion(anomalia: Anomalia): string {
    return GLOBAL.pcRecomendacion[anomalia.tipo];
  }

  getCriticidadLabel(anomalia: Anomalia): string {
    return this.anomaliaService.criterioCriticidad.labels[anomalia.criticidad];
  }

  getClaseLabel(anomalia: Anomalia): string {
    return `CoA ${anomalia.clase}`;
  }

  getPerdidasLabel(anomalia: Anomalia): string {
    return `${formatNumber(anomalia.perdidas * 100, this.locale, '1.0-0')}%`;
  }

  getTempMaxLabel(anomalia: Anomalia): string {
    return `${formatNumber(anomalia.temperaturaMax, this.locale, '1.0-1')} ºC`;
  }

  getGradNormLabel(anomalia: Anomalia): string {
    return `${formatNumber(anomalia.gradienteNormalizado, this.locale, '1.0-1')} ºC`;
  }

  getFechaHoraLabel(anomalia: Anomalia): string {
    let correctHoraSrt = 8;
    if (
      this.selectedInforme.hasOwnProperty('correctHoraSrt') &&
      this.selectedInforme.correccHoraSrt !== undefined &&
      this.selectedInforme.correccHoraSrt !== null
    ) {
      correctHoraSrt = this.selectedInforme.correccHoraSrt;
    }
    const correctHoraSrtUnix = correctHoraSrt * 3600;
    const fecha = formatDate((anomalia.datetime + correctHoraSrtUnix) * 1000, 'dd/MM/yyyy', this.locale);
    const hora = formatDate((anomalia.datetime + correctHoraSrtUnix) * 1000, 'HH:mm:ss', this.locale);

    return `${fecha} ${hora}`;
  }
}
