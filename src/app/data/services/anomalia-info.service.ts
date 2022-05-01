import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { formatNumber, formatDate } from '@angular/common';

import { AnomaliaService } from '@data/services/anomalia.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';
import { GLOBAL } from '@data/constants/global';
import { DownloadReportService } from './download-report.service';

import { Translation } from '@shared/utils/translations/translations';

import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import proj4 from 'proj4';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaInfoService {
  private selectedInforme: InformeInterface;
  private translation: Translation;
  private language: string;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private anomaliaService: AnomaliaService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private downloadReportService: DownloadReportService
  ) {
    this.downloadReportService.englishLang$.subscribe((lang) => {
      if (lang) {
        this.language = 'en';
      } else {
        this.language = 'es';
      }
      this.translation = new Translation(this.language);
    });

    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInforme = this.reportControlService.informes.find((informe) => informe.id === informeId);
    });
  }

  getTipoLabel(anomalia: Anomalia): string {
    return this.translation.t(GLOBAL.labels_tipos[anomalia.tipo]);
  }

  getCausa(anomalia: Anomalia): string {
    return this.translation.t(GLOBAL.pcCausa[anomalia.tipo]);
  }

  getRecomendacion(anomalia: Anomalia): string {
    return this.translation.t(GLOBAL.pcRecomendacion[anomalia.tipo]);
  }

  getCriticidadLabel(anomalia: Anomalia): string {
    return this.translation.t(this.anomaliaService.criterioCriticidad.labels[anomalia.criticidad]);
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

  getModuloLabel(anomalia: Anomalia): string {
    if (
      !anomalia.hasOwnProperty('modulo') ||
      anomalia.modulo === null ||
      anomalia.modulo === undefined ||
      anomalia.modulo === ''
    ) {
      return this.translation.t('Desconocido');
    } else {
      const modulo = anomalia.modulo;

      let labelModulo = '';
      if (modulo !== null) {
        if (modulo.hasOwnProperty('marca')) {
          labelModulo = labelModulo.concat(modulo.marca.toString()).concat(' ');
        }
        if (modulo.hasOwnProperty('modelo')) {
          labelModulo = labelModulo.concat(modulo.modelo.toString()).concat(' ');
        }
        if (modulo.hasOwnProperty('potencia')) {
          labelModulo = labelModulo.concat('(').concat(modulo.potencia.toString()).concat(' W)');
        }
      }
      if (labelModulo === '') {
        labelModulo = this.translation.t('Desconocido');
      }

      return labelModulo;
    }
  }

  getLocalizacionReducLabel(anomalia: Anomalia, planta: PlantaInterface) {
    let label = '';

    const globals = anomalia.globalCoords.filter((coord) => coord !== undefined && coord !== null && coord !== '');

    globals.forEach((coord, index) => {
      label += coord;

      if (index < globals.length - 1) {
        label += this.plantaService.getGlobalsConector(planta);
      }
    });

    return label;
  }

  getLocalizacionCompleteLabel(anomalia: Anomalia, planta: PlantaInterface) {
    let label = '';

    const globals = anomalia.globalCoords.filter((coord) => coord !== undefined && coord !== null && coord !== '');

    globals.forEach((coord, index) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        if (planta.hasOwnProperty('nombreGlobalCoords')) {
          label += `${this.translation.t(planta.nombreGlobalCoords[index])}: ${coord} / `;
        } else {
          label += `${coord} / `;
        }
      }
    });

    const numModulo = this.plantaService.getNumeroModulo(anomalia, 'anomalia', planta);
    if (numModulo !== undefined) {
      if (!isNaN(Number(numModulo))) {
        label += `${this.translation.t('Nº módulo')}: ${numModulo}`;
      } else {
        label += `${this.translation.t('Fila')}: ${anomalia.localY} / ${this.translation.t('Columna')}: ${
          anomalia.localX
        }`;
      }
    }

    return label;
  }

  getGoogleMapsUrl(coord: number[]): string {
    const coordConverted = proj4('EPSG:3857', 'EPSG:4326', coord);

    const url = `http://www.google.com/maps/place/${coordConverted[1]},${coordConverted[0]}/data=!3m1!1e3`;

    return url;
  }
}
