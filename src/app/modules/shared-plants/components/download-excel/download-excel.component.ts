import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { Subscription } from 'rxjs';

import { ExcelService } from '@data/services/excel.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { OlMapService } from '@data/services/ol-map.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { FilterableElement } from '@core/models/filterableInterface';

import { Translation } from '@shared/utils/translations/translations';

import { Patches } from '@core/classes/patches';

interface Fila {
  // localId?: string;
  numAnom?: number;
  visualImage?: string;
  thermalImage?: string;
  temperaturaRef?: number;
  temperaturaMax?: number;
  gradienteNormalizado?: number;
  tipo?: string;
  clase?: number;
  criticidad?: string;
  urlMaps?: string;
  localizacion?: string;
  localY?: number;
  localX?: number;
  numeroModulo?: number;
  irradiancia?: number;
  datetime?: string;
  lugar?: string;
  nubosidad?: number;
  temperaturaAire?: number;
  emisividad?: number;
  temperaturaReflejada?: number;
  vientoVelocidad?: number;
  vientoDirección?: number;
  viento?: string;
  camaraModelo?: string;
  camaraSN?: number;
  modulo?: string;
  numeroSerie?: string;
  comentario?: string;
  curvaIV?: string;
  actuaciones?: string;
}

@Component({
  selector: 'app-download-excel',
  templateUrl: './download-excel.component.html',
  styleUrls: ['./download-excel.component.css'],
  providers: [DatePipe, DecimalPipe],
})
export class DownloadExcelComponent implements OnInit, OnDestroy {
  private json: any[] = [];
  private excelFileName: string;
  private columnas: string[][] = [[], [], [], [], []];
  private sheetName: string;
  private anomaliasInforme: Anomalia[] = [];
  private informeSelected: InformeInterface;
  private planta: PlantaInterface;
  private allElems: FilterableElement[];
  private translation: Translation;
  private language: string;
  private headersColors = ['FFE5E7E9', 'FFF5B7B1', 'FFD4EFDF', 'FFABD5FF', 'FFE5E7E9'];
  private columnasLink = [10];
  private inicioFilters = 4;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private excelService: ExcelService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private decimalPipe: DecimalPipe,
    private anomaliaInfoService: AnomaliaInfoService,
    private downloadReportService: DownloadReportService,
    private anomaliaService: AnomaliaService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.downloadReportService.englishLang$.subscribe((lang) => {
        if (lang) {
          this.language = 'en';
        } else {
          this.language = 'es';
        }
      })
    );

    this.planta = this.reportControlService.planta;

    this.allElems = this.reportControlService.allFilterableElements;

    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.informeSelected = this.reportControlService.informes.find((informe) => informeId === informe.id);

      // filtramos las anomalias del informe seleccionado
      this.anomaliasInforme = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informeId);

      // ordenamos la lista de anomalias por su indice
      this.anomaliasInforme = this.anomaliasInforme.sort((a, b) => a.numAnom - b.numAnom);

      if (!this.reportControlService.plantaNoS2E) {
        this.columnasLink = [11];
      }

      this.inicioFilters = 7;

      // vaciamos el contenido con cada cambio de informe
      this.json = new Array(this.anomaliasInforme.length);

      // reseteamos el contador de filas
      // this.linksCargados = 0;
    });
  }

  checkDownloadType() {
    this.translation = new Translation(this.language);

    this.excelFileName = this.translation.t('Informe');
    this.sheetName = this.translation.t('Resultados');

    // mostramos la barra de progreso al iniciar la descarga
    this.downloadReportService.generatingDownload = true;
    this.downloadReportService.endingDownload = false;
    this.downloadReportService.typeDownload = 'excel';

    // si tiene prefijo le ponemos ese nombre
    if (this.informeSelected.hasOwnProperty('prefijo')) {
      this.excelFileName = this.informeSelected.prefijo + this.translation.t('informe');
    }

    this.getColumnas();

    this.anomaliasInforme.forEach((anom, index) => this.getRowData(anom, index));

    this.downloadExcel();
  }

  downloadExcel(): void {
    this.excelService.exportAsExcelFile(
      this.columnas,
      this.headersColors,
      this.json,
      this.excelFileName,
      this.sheetName,
      this.columnasLink,
      undefined,
      undefined,
      this.inicioFilters
    );

    // ocultamos la barra de progreso
    this.downloadReportService.generatingDownload = false;

    // vaciamos el contenido para la proxima descarga
    this.clearData();
  }

  private getColumnas() {
    this.columnas[0].push(this.translation.t('# Anomalía'));

    if (!this.reportControlService.plantaNoS2E) {
      this.columnas[1].push(this.translation.t('Temperatura referencia') + ' (ºC)');
    }

    this.columnas[1].push(this.translation.t('Temperatura máxima') + ' (ºC)');
    this.columnas[1].push(this.translation.t('Gradiente temp. Normalizado') + ' (ºC)');
    this.columnas[1].push(this.translation.t('Categoría'));
    this.columnas[1].push('CoA');
    this.columnas[1].push(this.translation.t('Criticidad'));

    if (this.reportControlService.plantaNoS2E) {
      this.columnas[2].push(
        this.translation.t('Localización') +
          ' (' +
          this.plantaService.getLabelNombreGlobalCoords(this.planta, this.language) +
          ')'
      );
    } else {
      this.columnas[2].push(this.translation.t('Seguidor'));
    }

    if (this.planta.hasOwnProperty('etiquetasLocalXY') || this.planta.hasOwnProperty('posicionModulo')) {
      this.columnas[2].push(this.translation.t('Nº Módulo'));
      this.columnasLink = this.columnasLink.map((col) => col - 1);
    } else {
      this.columnas[2].push(this.translation.t('Fila'));
      this.columnas[2].push(this.translation.t('Columna'));
    }

    this.columnas[2].push('Google maps');
    this.columnas[2].push(this.translation.t('Fecha y hora'));
    this.columnas[2].push(this.translation.t('Lugar'));
    this.columnas[2].push(this.translation.t('Irradiancia') + ' (beta) (W/m2)');

    this.columnas[3].push(this.translation.t('Nubosidad (octavas)'));
    this.columnas[3].push(this.translation.t('Temperatura ambiente') + ' (ºC)');
    this.columnas[3].push(this.translation.t('Emisividad'));
    this.columnas[3].push(this.translation.t('Temperatura reflejada') + ' (ºC)');

    if (this.informeSelected.hasOwnProperty('vientoVelocidad')) {
      this.columnas[3].push(this.translation.t('Velocidad viento') + ' (Beaufort)');
      this.columnas[3].push(this.translation.t('Dirección viento') + ' (º)');
    } else if (this.informeSelected.hasOwnProperty('viento')) {
      this.columnas[3].push(this.translation.t('Viento'));
    }

    if (this.informeSelected.hasOwnProperty('camara')) {
      this.columnas[4].push(this.translation.t('Cámara térmica y visual'));
    }
    if (this.informeSelected.hasOwnProperty('camaraSN')) {
      this.columnas[4].push(this.translation.t('Número de serie cámara'));
    }

    this.columnas[4].push(this.translation.t('Módulo'));
    this.columnas[4].push(this.translation.t('Nº de serie'));
    this.columnas[4].push(this.translation.t('Comentarios'));
    this.columnas[4].push(this.translation.t('Curvas IV'));
    this.columnas[4].push(this.translation.t('Actuaciones'));
  }

  private getRowData(anomalia: Anomalia, index: number) {
    const row: Fila = {};

    row.numAnom = anomalia.numAnom;

    if (!this.reportControlService.plantaNoS2E) {
      row.temperaturaRef = Number(this.decimalPipe.transform(anomalia.temperaturaRef, '1.2-2'));
    }

    row.temperaturaMax = Number(this.decimalPipe.transform(anomalia.temperaturaMax, '1.2-2'));

    row.gradienteNormalizado = Number(this.decimalPipe.transform(anomalia.gradienteNormalizado, '1.2-2'));

    row.tipo = this.anomaliaInfoService.getTipoLabel(anomalia);

    row.clase = anomalia.clase;

    row.criticidad = this.anomaliaInfoService.getCriticidadLabel(anomalia, this.anomaliaService.criterioCriticidad);

    if (this.reportControlService.plantaNoS2E) {
      row.localizacion = this.anomaliaInfoService.getLocalizacionReducLabel(anomalia, this.planta);
    } else {
      row.localizacion = anomalia.nombreSeguidor;
    }

    if (this.planta.hasOwnProperty('etiquetasLocalXY') || this.planta.hasOwnProperty('posicionModulo')) {
      row.numeroModulo = this.anomaliaInfoService.getNumeroModulo(anomalia, this.planta);
    } else {
      row.localY = this.anomaliaInfoService.getAlturaAnom(anomalia, this.planta);
      row.localX = this.anomaliaInfoService.getColumnaAnom(anomalia, this.planta);
    }

    if (this.reportControlService.plantaNoS2E) {
      row.urlMaps = this.anomaliaInfoService.getGoogleMapsUrl(this.olMapService.getCentroid(anomalia.featureCoords));
    } else {
      const seguidor = (this.allElems as Seguidor[]).find((seg) => seg.nombre === anomalia.nombreSeguidor);

      row.urlMaps = this.anomaliaInfoService.getGoogleMapsUrl(this.olMapService.getCentroid(seguidor.featureCoords));
    }

    let datetime = anomalia.datetime;
    if (this.informeSelected.correccHoraSrt !== undefined) {
      datetime += this.informeSelected.correccHoraSrt * 3600;
    }
    row.datetime = this.anomaliaInfoService.getFechaHoraLabel(anomalia, this.informeSelected);

    row.lugar = this.planta.nombre;

    if (anomalia.hasOwnProperty('irradiancia') && anomalia.irradiancia !== null) {
      row.irradiancia = anomalia.irradiancia;
    } else {
      row.irradiancia = this.anomaliaService.getIrradiancia(datetime);
    }

    row.nubosidad = this.informeSelected.nubosidad;

    row.temperaturaAire = this.informeSelected.temperatura;

    row.emisividad = this.informeSelected.emisividad;

    row.temperaturaReflejada = this.informeSelected.tempReflejada;

    if (this.informeSelected.hasOwnProperty('vientoVelocidad')) {
      row.vientoVelocidad = this.informeSelected.vientoVelocidad;
      row.vientoDirección = this.informeSelected.vientoDireccion;
    } else if (this.informeSelected.hasOwnProperty('viento')) {
      row.viento = this.informeSelected.viento;
    }

    if (this.informeSelected.hasOwnProperty('camara')) {
      row.camaraModelo = this.informeSelected.camara;
    }

    if (this.informeSelected.hasOwnProperty('camaraSN')) {
      row.camaraSN = this.informeSelected.camaraSN;
    }

    row.modulo = this.anomaliaInfoService.getModuloLabel(anomalia);

    row.numeroSerie = this.anomaliaInfoService.getNumeroSerie(anomalia);

    [row.comentario, row.curvaIV, row.actuaciones] = this.anomaliaInfoService.getComentariosString(anomalia);

    this.json[index] = row;
  }

  clearData() {
    this.columnas = [[], [], [], [], []];
    this.json = [];
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
