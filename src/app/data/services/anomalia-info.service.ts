import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { formatNumber, formatDate } from '@angular/common';

import { Subscription } from 'rxjs';

import proj4 from 'proj4';

import { DownloadReportService } from './download-report.service';

import { Translation } from '@shared/utils/translations/translations';

import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

import { PcInterface } from '@core/models/pc';
import { CritCriticidad } from '@core/models/critCriticidad';

import { GLOBAL } from '@data/constants/global';
import { COLOR } from '@data/constants/color';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaInfoService {
  private translation: Translation;
  private language: string;

  private subscriptions: Subscription = new Subscription();

  constructor(@Inject(LOCALE_ID) public locale: string, private downloadReportService: DownloadReportService) {
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

  getCriticidadLabel(anomalia: Anomalia, criterio: CritCriticidad): string {
    return this.translation.t(criterio.labels[anomalia.criticidad]);
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
        label += this.getGlobalsConector(planta);
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

    const numModulo = this.getNumeroModulo(anomalia, planta, 'anomalia');
    if (numModulo !== undefined) {
      if (!isNaN(Number(numModulo))) {
        label += `${this.translation.t('Nº módulo')}: ${numModulo}`;
      } else {
        const altura = this.getAlturaAnom(anomalia, planta);
        const columna = this.getColumnaAnom(anomalia, planta);
        label += `${this.translation.t('Fila')}: ${altura} / ${this.translation.t('Columna')}: ${columna}`;
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

  getAlturaAnom(anomalia: Anomalia, planta: PlantaInterface): number {
    let localY = anomalia.localY;
    if (planta.alturaBajaPrimero) {
      if (planta.tipo === 'seguidores' && anomalia.hasOwnProperty('tipoSeguidor')) {
        // si se cuenta por filas la altura es el nº de filas
        let altura = anomalia.tipoSeguidor.numModulos.length;
        // si se cuenta por columnas entonces la altura es idependiente por columna
        if (!anomalia.tipoSeguidor.tipoFila) {
          altura = anomalia.tipoSeguidor.numModulos[anomalia.localX - 1];
        }
        localY = altura - localY + 1;
      } else if (planta.tipo !== 'seguidores') {
        // para fijas la altura se basa en el nº de filas de la planta
        localY = planta.filas - localY + 1;
      }
    }
    return localY;
  }

  getColumnaAnom(anomalia: Anomalia, planta: PlantaInterface): number {
    let localX = anomalia.localX;
    if (planta.hasOwnProperty('columnaDchaPrimero') && planta.columnaDchaPrimero) {
      if (planta.tipo === 'seguidores' && anomalia.hasOwnProperty('tipoSeguidor')) {
        // si se cuenta por columnas el nº de columnas es equivalente al array
        let columnas = anomalia.tipoSeguidor.numModulos.length;
        // si se cuenta por filas la altura es el nº de filas
        if (anomalia.tipoSeguidor.tipoFila) {
          columnas = anomalia.tipoSeguidor.numModulos[anomalia.localY - 1];
        }
        localX = columnas - localX + 1;
      }
    }
    return localX;
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

  getNumeroModulo(elem: PcInterface | Anomalia, planta: PlantaInterface, type?: string): string {
    let localX = (elem as PcInterface).local_x;
    let localY = (elem as PcInterface).local_y;
    if (type === 'anomalia') {
      localX = (elem as Anomalia).localX;
      localY = (elem as Anomalia).localY;
    }

    const altura = this.getAlturaAnom(elem as Anomalia, planta);

    if (
      planta.hasOwnProperty('etiquetasLocalXY') &&
      planta.etiquetasLocalXY[altura] !== undefined &&
      planta.etiquetasLocalXY[altura][localX - 1] !== undefined
    ) {
      return planta.etiquetasLocalXY[altura][localX - 1];
    }

    return this.getEtiquetaLocalX(planta, elem, type).concat('/').concat(this.getEtiquetaLocalY(planta, elem, type));
  }

  getEtiquetaLocalX(planta: PlantaInterface, elem: PcInterface | Anomalia, type?: string): string {
    let localX = (elem as PcInterface).local_x;
    if (type === 'anomalia') {
      localX = (elem as Anomalia).localX;
    }

    if (localX <= 0) {
      return GLOBAL.stringParaDesconocido;
    }
    if (planta.hasOwnProperty('etiquetasLocalX')) {
      const newLocalX = localX > planta.etiquetasLocalX.length ? planta.etiquetasLocalX.length : localX;
      return planta.etiquetasLocalX[newLocalX - 1];
    }
    return localX.toString();
  }

  getEtiquetaLocalY(planta: PlantaInterface, elem: PcInterface | Anomalia, type?: string): string {
    let localY = (elem as PcInterface).local_y;
    if (type === 'anomalia') {
      localY = (elem as Anomalia).localY;
    }

    if (localY <= 0) {
      return GLOBAL.stringParaDesconocido;
    }
    if (planta.hasOwnProperty('etiquetasLocalY')) {
      const newLocalY = localY > planta.etiquetasLocalY.length ? planta.etiquetasLocalY.length : localY;
      if (planta.alturaBajaPrimero) {
        return planta.etiquetasLocalY[newLocalY - 1];
      }
      return planta.etiquetasLocalY[planta.etiquetasLocalY.length - newLocalY];
    }
    return this.getAlturaAnom(elem as Anomalia, planta).toString();
  }

  getEtiquetaGlobals(pc: PcInterface, planta: PlantaInterface): string {
    let nombreEtiqueta = '';
    if (pc.hasOwnProperty('global_x') && !Number.isNaN(pc.global_x) && pc.global_x !== null) {
      nombreEtiqueta = nombreEtiqueta.concat(pc.global_x.toString());
    }
    if (pc.hasOwnProperty('global_y') && !Number.isNaN(pc.global_y) && pc.global_y !== null) {
      if (nombreEtiqueta.length > 0) {
        nombreEtiqueta = nombreEtiqueta.concat(this.getGlobalsConector(planta));
      }
      nombreEtiqueta = nombreEtiqueta.concat(pc.global_y.toString());
    }
    return nombreEtiqueta;
  }

  getGlobalsConector(planta: PlantaInterface): string {
    if (planta.hasOwnProperty('stringConectorGlobals')) {
      return planta.stringConectorGlobals;
    }

    return GLOBAL.stringConectorGlobalsDefault;
  }

  getNombreColsGlobal(planta: PlantaInterface) {
    let nombreCol = this.getNombreGlobalX(planta);
    if (nombreCol.length > 0) {
      nombreCol = nombreCol.concat(this.getGlobalsConector(planta));
    }
    nombreCol = nombreCol.concat(this.getNombreGlobalY(planta));

    return nombreCol;
  }

  getNombreGlobalX(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalX')) {
        return planta.nombreGlobalX;
      }
      return GLOBAL.nombreGlobalXFija;
    }
    return '';
  }

  getNombreGlobalY(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalY')) {
        return planta.nombreGlobalY;
      }
      return GLOBAL.nombreGlobalYFija;
    }
    return '';
  }

  getNombreGlobalZ(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalZ')) {
        return planta.nombreGlobalZ;
      }
      return GLOBAL.nombreGlobalZFija;
    }
    return '';
  }

  getNombreLocalX(planta: PlantaInterface): string {
    if (planta.hasOwnProperty('nombreLocalX')) {
      return planta.nombreLocalX;
    }
    return GLOBAL.nombreLocalXFija;
  }

  getNombreLocalY(planta: PlantaInterface): string {
    if (planta.hasOwnProperty('nombreLocalY')) {
      return planta.nombreLocalY;
    }
    return GLOBAL.nombreLocalYFija;
  }

  resetService() {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }
}
