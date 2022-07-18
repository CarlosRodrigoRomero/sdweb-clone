import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { formatNumber, formatDate } from '@angular/common';

import { Subscription } from 'rxjs';

import proj4 from 'proj4';

import { AnomaliaService } from '@data/services/anomalia.service';
import { PlantaService } from '@data/services/planta.service';
import { GLOBAL } from '@data/constants/global';
import { DownloadReportService } from './download-report.service';

import { Translation } from '@shared/utils/translations/translations';

import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

import { COLOR } from '@data/constants/color';
import { TipoSeguidor } from '@core/models/tipoSeguidor';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaInfoService {
  private translation: Translation;
  private language: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private anomaliaService: AnomaliaService,
    private plantaService: PlantaService,
    private downloadReportService: DownloadReportService
  ) {
    this.subscriptions.add(
      this.downloadReportService.englishLang$.subscribe((lang) => {
        if (lang) {
          this.language = 'en';
        } else {
          this.language = 'es';
        }
        this.translation = new Translation(this.language);
      })
    );
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

  getFechaHoraLabel(anomalia: Anomalia, informe: InformeInterface): string {
    let correctHoraSrt = 8;
    if (
      informe.hasOwnProperty('correctHoraSrt') &&
      informe.correccHoraSrt !== undefined &&
      informe.correccHoraSrt !== null
    ) {
      correctHoraSrt = informe.correccHoraSrt;
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

  getLocalizacionCompleteLabel(anomalia: Anomalia, planta: PlantaInterface, tipoSeguidor?: TipoSeguidor) {
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
        const altura = this.anomaliaService.getAlturaAnom(anomalia, planta, tipoSeguidor);
        label += `${this.translation.t('Fila')}: ${altura} / ${this.translation.t('Columna')}: ${anomalia.localX}`;
      }
    }

    return label;
  }

  getGoogleMapsUrl(coord: number[]): string {
    const coordConverted = proj4('EPSG:3857', 'EPSG:4326', coord);

    const url = `http://www.google.com/maps/place/${coordConverted[1]},${coordConverted[0]}/data=!3m1!1e3`;

    return url;
  }

  getAltura(localY: number, planta: PlantaInterface) {
    // Por defecto, la altura alta es la numero 1
    if (planta.tipo !== 'seguidores' && planta.alturaBajaPrimero) {
      let altura = planta.filas - (localY - 1);
      if (altura < 1) {
        altura = 1;
      }
      return altura;
    } else {
      return localY;
    }
  }

  getPerdidasColor(perdidas: number): string {
    if (perdidas < 0.3) {
      return COLOR.colores_severity[0];
    } else if (perdidas < 0.5) {
      return COLOR.colores_severity[1];
    } else {
      return COLOR.colores_severity[2];
    }
  }

  resetService() {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }
}
