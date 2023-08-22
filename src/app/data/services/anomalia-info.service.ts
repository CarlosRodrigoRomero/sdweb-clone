import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { formatNumber, formatDate } from '@angular/common';

import { Subscription, combineLatest } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

import proj4 from 'proj4';

import { DownloadReportService } from './download-report.service';

import { Translation } from '@shared/utils/translations/translations';

import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

import { Pc, PcInterface } from '@core/models/pc';
import { CritCriticidad } from '@core/models/critCriticidad';

import { GLOBAL } from '@data/constants/global';
import { COLOR } from '@data/constants/color';
import { Comentario } from '@core/models/comentario';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaInfoService {
  private translation: Translation;
  private language: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private downloadReportService: DownloadReportService,
    private translate: TranslateService
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

  getCriticidadLabel(anomalia: Anomalia, criterio: CritCriticidad): string {
    return this.translation.t(criterio.labels[anomalia.criticidad]);
  }

  getClaseLabel(anomalia: Anomalia): string {
    return `CoA ${anomalia.clase}`;
  }

  getPerdidasLabel(anomalia: Anomalia): string {
    if (anomalia.perdidas < 0.1) {
      return 'Bajas';
    } else if (anomalia.perdidas < 0.3) {
      return 'Medias';
    } else {
      return 'Altas';
    }

    // return `${formatNumber(anomalia.perdidas * 100, this.locale, '1.0-0')}%`;
  }

  getTempMaxLabel(anomalia: Anomalia): string {
    return `${formatNumber(anomalia.temperaturaMax, this.locale, '1.0-1')} ºC`;
  }

  getGradNormLabel(anomalia: Anomalia): string {
    return `${formatNumber(anomalia.gradienteNormalizado, this.locale, '1.0-1')} ºC`;
  }

  getFechaHoraLabel(anomalia: Anomalia, informe: InformeInterface): string {
    let correccHoraSrt = 8;
    if (
      informe.hasOwnProperty('correccHoraSrt') &&
      informe.correccHoraSrt !== undefined &&
      informe.correccHoraSrt !== null
    ) {
      correccHoraSrt = informe.correccHoraSrt;
    }
    const correccHoraSrtUnix = correccHoraSrt * 3600;

    const date = new Date((anomalia.datetime + correccHoraSrtUnix) * 1000);

    return date.toLocaleString('es-ES', { hour12: false });
  }

  getModuloLabel(anomalia: Anomalia): string {
    if (!anomalia.hasOwnProperty('modulo') || anomalia.modulo === null || anomalia.modulo === undefined) {
      return this.translation.t('Desconocido');
    } else {
      const modulo = anomalia.modulo;

      let labelModulo = '';
      if (modulo !== null) {
        if (modulo.hasOwnProperty('marca')) {
          labelModulo = labelModulo.concat(modulo.marca.toString()).concat(' ');
        }
        // if (modulo.hasOwnProperty('modelo')) {
        //   labelModulo = labelModulo.concat(modulo.modelo.toString()).concat(' ');
        // }
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

  getRightGlobalCoords(anomalia: Anomalia): string[] {
    let globalCoords = anomalia.globalCoords;
    for (let index = anomalia.globalCoords.length - 1; index >= 0; index--) {
      const gC = anomalia.globalCoords[index];
      if (gC !== null) {
        globalCoords = anomalia.globalCoords.slice(0, index + 1);
        break;
      }
    }

    return globalCoords;
  }

  getLocalizacionReducLabel(anomalia: Anomalia, planta: PlantaInterface): string {
    const globalCoords = this.getRightGlobalCoords(anomalia);

    return globalCoords.join(this.getGlobalsConector(planta));
  }

  getPosicionReducLabel(anomalia: Anomalia): string {
    let label: string;
    this.translate
      .get('Fil')
      .pipe(take(1))
      .subscribe((res: string[]) => {
        label = `${res}: ${anomalia.localY} / Col: ${anomalia.localX}`;
      });

    return label;
  }

  getLocalizacionTranslateLabel(anomalia: Anomalia, planta: PlantaInterface): string {
    let label = '';

    if (anomalia.hasOwnProperty('globalCoords')) {
      let globals = anomalia.globalCoords.filter((coord) => coord !== undefined && coord !== null && coord !== '');

      globals.forEach((coord, index) => {
        if (coord !== undefined && coord !== null && coord !== '') {
          if (planta?.nombreGlobalCoords[index]) {
            this.subscriptions.add(
              this.translate.get(planta.nombreGlobalCoords[index]).subscribe((res: string) => {
                label += `${res}: ${coord}`;
              })
            );
          } else {
            label += `${coord}`;
          }
        }
        if (index < globals.length - 1) {
          label += ' / ';
        }
      });
    }
    return label;
  }

  getLocalizacionCompleteElems(anomalia: Anomalia, planta: PlantaInterface): string[] {
    const elems: string[] = [];

    const globals = this.getRightGlobalCoords(anomalia);

    globals.forEach((coord, index) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        if (planta.hasOwnProperty('nombreGlobalCoords')) {
          elems.push(`${this.translation.t(planta.nombreGlobalCoords[index])}: ${coord}`);
        } else {
          elems.push(`${coord}`);
        }
      }
    });

    const numModulo = this.getNumeroModulo(anomalia, planta);
    if (numModulo !== null) {
      elems.push(`${this.translation.t('Nº módulo')}: ${numModulo}`);
    } else {
      const altura = this.getAlturaAnom(anomalia, planta);
      const columna = this.getColumnaAnom(anomalia, planta);
      elems.push(`${this.translation.t('Fila')}: ${altura} / ${this.translation.t('Columna')}: ${columna}`);
    }

    return elems;
  }

  getLocalizacionCompleteTranslateLabel(anomalia: Anomalia, planta: PlantaInterface) {
    let label = '';

    if (anomalia.hasOwnProperty('globalCoords')) {
      const globals = anomalia.globalCoords.filter((coord) => coord !== undefined && coord !== null && coord !== '');

      globals.forEach((coord, index) => {
        if (coord !== undefined && coord !== null && coord !== '') {
          if (planta?.nombreGlobalCoords[index]) {
            this.subscriptions.add(
              this.translate.get(planta.nombreGlobalCoords[index]).subscribe((res: string) => {
                label += `${res}: ${coord}`;
              })
            );
          } else {
            label += `${coord} / `;
          }
        }
        if (index < globals.length - 1) {
          label += ' / ';
        }
      });
    }

    const numModulo = this.getNumeroModulo(anomalia, planta);
    if (numModulo !== null) {
      label += `${this.translation.t('Nº módulo')}: ${numModulo.toString()}`;
    } else {
      const altura = this.getAlturaAnom(anomalia, planta);
      const columna = this.getColumnaAnom(anomalia, planta);
      let fila: string;
      this.translate
        .get('Fila')
        .pipe(
          switchMap((res: string) => {
            fila = res;
            return this.translate.get('Columna');
          })
        )
        .subscribe((res: string) => {
          label += `${fila}: ${altura} / ${res}: ${columna}`;
        });
    }

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

    const numModulo = this.getNumeroModulo(anomalia, planta);
    if (numModulo !== null) {
      label += `${this.translation.t('Nº módulo')}: ${numModulo.toString()}`;
    } else {
      const altura = this.getAlturaAnom(anomalia, planta);
      const columna = this.getColumnaAnom(anomalia, planta);
      label += `${this.translation.t('Fila')}: ${altura} / ${this.translation.t('Columna')}: ${columna}`;
    }

    return label;
  }

  getPosicionModuloLabel(anomalia: Anomalia, planta: PlantaInterface) {
    let label = '';

    const numModulo = this.getNumeroModulo(anomalia, planta);
    if (numModulo !== null) {
      label += `${this.translation.t('Nº módulo')}: ${numModulo.toString()}`;
    } else {
      const altura = this.getAlturaAnom(anomalia, planta);
      const columna = this.getColumnaAnom(anomalia, planta);
      label += `${this.translation.t('Fila')}: ${altura} / ${this.translation.t('Columna')}: ${columna}`;
    }

    return label;
  }

  getPosicionModuloTranslateLabel(anomalia: Anomalia, planta: PlantaInterface) {
    let label = '';

    const numModulo = this.getNumeroModulo(anomalia, planta);
    if (numModulo !== null) {
      this.translate
        .get('Nº módulo')
        .pipe(take(1))
        .subscribe((res: string) => {
          label += `${res}: ${numModulo.toString()}`;
        });
    } else {
      const altura = this.getAlturaAnom(anomalia, planta);
      const columna = this.getColumnaAnom(anomalia, planta);

      this.translate
        .get('Fila')
        .pipe(
          take(1),
          switchMap((res: string) => {
            label += `${res}: ${altura} / `;

            return this.translate.get('Columna');
          }),
          take(1)
        )
        .subscribe((res: string) => {
          label += `${res}: ${columna}`;
        });
    }

    return label;
  }

  getPosicionModuloSeguidorLabel(anomalia: Anomalia, planta: PlantaInterface) {
    let label = '';

    const numModulo = this.getNumeroModulo(anomalia, planta);
    if (numModulo !== null) {
      this.translate
        .get('Nº módulo')
        .pipe(take(1))
        .subscribe((res: string) => {
          label += `${res}: ${numModulo.toString()}`;
        });
    } else {
      combineLatest([this.translate.get('Fila'), this.translate.get('Columna')])
        .pipe(take(1))
        .subscribe(([fil, col]) => {
          const altura = this.getAlturaAnom(anomalia, planta);
          const columna = this.getColumnaAnom(anomalia, planta);

          label += `${fil}: ${altura} / ${col}: ${columna}`;
        });
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
    let localY: number = null;
    if (anomalia) {
      localY = anomalia.localY;
      if (planta.alturaBajaPrimero) {
        if (anomalia.hasOwnProperty('tipoSeguidor')) {
          // si se cuenta por filas la altura es el nº de filas
          let altura = anomalia.tipoSeguidor.numModulos.length;
          // si se cuenta por columnas entonces la altura es idependiente por columna
          if (!anomalia.tipoSeguidor.tipoFila) {
            altura = anomalia.tipoSeguidor.numModulos[anomalia.localX - 1];
          }
          localY = altura - localY + 1;
        } else {
          // para fijas la altura se basa en el nº de filas de la planta
          localY = planta.filas - localY + 1;
        }
      }
    }

    return Number(localY);
  }

  getColumnaAnom(anomalia: Anomalia, planta: PlantaInterface): number {
    let localX: number = null;
    if (anomalia) {
      localX = anomalia.localX;
      if (planta.hasOwnProperty('columnaDchaPrimero') && planta.columnaDchaPrimero) {
        if (anomalia.hasOwnProperty('tipoSeguidor')) {
          // si se cuenta por columnas el nº de columnas es equivalente al array
          let columnas = anomalia.tipoSeguidor.numModulos.length;
          // si se cuenta por filas la altura es el nº de filas
          if (anomalia.tipoSeguidor.tipoFila) {
            columnas = anomalia.tipoSeguidor.numModulos[anomalia.localY - 1];
          }
          localX = columnas - localX + 1;
        }
      }
    }
    return Number(localX);
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

  getNumeroModulo(anomalia: Anomalia, planta: PlantaInterface): number {
    let numeroModulo: number = null;
    if (anomalia) {
      const columna = anomalia.localX;
      const fila = this.getAlturaAnom(anomalia, planta);

      if (
        planta.hasOwnProperty('etiquetasLocalXY') &&
        planta.etiquetasLocalXY[fila] !== undefined &&
        planta.etiquetasLocalXY[fila][columna - 1] !== undefined
      ) {
        numeroModulo = Number(planta.etiquetasLocalXY[fila][columna - 1]);
      }

      if (planta.hasOwnProperty('posicionModulo') && planta.posicionModulo === true) {
        const anom = anomalia;
        if (anom.hasOwnProperty('tipoSeguidor')) {
          if (anom.tipoSeguidor.tipoFila) {
            let numModulo = 0;
            anom.tipoSeguidor.numModulos.forEach((num, index) => {
              if (index < fila - 1) {
                numModulo += num;
              } else if (index === fila - 1) {
                numModulo += columna;
              }
              numeroModulo = numModulo;
            });
          } else {
            let numModulo = 0;
            anom.tipoSeguidor.numModulos.forEach((num, index) => {
              if (index < columna - 1) {
                numModulo += num;
              } else if (index === columna - 1) {
                numModulo += fila;
              }
            });
            numeroModulo = numModulo;
          }
        }
      }
    }

    return numeroModulo;
  }

  getLabelLocalXY(elem: PcInterface | Anomalia, planta: PlantaInterface) {
    return this.getEtiquetaLocalX(planta, elem).concat('/').concat(this.getEtiquetaLocalY(planta, elem));
  }

  getEtiquetaLocalX(planta: PlantaInterface, elem: PcInterface | Anomalia): string {
    let localX = (elem as PcInterface).local_x;
    if (localX === undefined) {
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

  getEtiquetaLocalY(planta: PlantaInterface, elem: PcInterface | Anomalia): string {
    let localY = (elem as PcInterface).local_y;
    if (localY === undefined) {
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

  getNumeroSerie(anomalia: Anomalia): string {
    let numeroSerie = '';
    if (anomalia.hasOwnProperty('numeroSerie')) {
      numeroSerie = anomalia.numeroSerie;
    }
    return numeroSerie;
  }

  getComentariosString(anomalia: Anomalia): string[] {
    if (anomalia.hasOwnProperty('comentarios') && anomalia.comentarios.length > 0) {
      const comentario: Comentario = anomalia.comentarios.find((c) => c.tipo === 'anomalia');
      const curvaIV: Comentario = anomalia.comentarios.find((c) => c.tipo === 'iv');
      const actuaciones: Comentario = anomalia.comentarios.find((c) => c.tipo === 'actuaciones');

      return [comentario ? comentario.texto : '', curvaIV ? curvaIV.texto : '', actuaciones ? actuaciones.texto : ''];
    }

    return ['', '', ''];
  }

  resetService() {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }
}
