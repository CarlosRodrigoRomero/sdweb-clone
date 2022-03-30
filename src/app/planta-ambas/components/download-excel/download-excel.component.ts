import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { AngularFireStorage } from '@angular/fire/storage';

import { switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';

import { ExcelService } from '@core/services/excel.service';
import { ReportControlService } from '@core/services/report-control.service';
import { PlantaService } from '@core/services/planta.service';
import { AnomaliaInfoService } from '@core/services/anomalia-info.service';
import { DownloadReportService } from '@core/services/download-report.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { GLOBAL } from '@core/services/global';
import { ModuloInterface } from '@core/models/modulo';
import { PcInterface } from '@core/models/pc';
import { FilterableElement } from '@core/models/filterableInterface';

import { Translation } from '@shared/utils/translations/translations';

interface Fila {
  localId?: string;
  visualImage?: string;
  thermalImage?: string;
  temperaturaRef?: number;
  temperaturaMax?: number;
  gradienteNormalizado?: number;
  tipo?: string;
  clase?: number;
  criticidad?: string;
  // urlMaps?: string;
  localizacion?: string;
  localY?: number;
  localX?: number;
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
  private _linksCargados = 0;
  private linksCargados$ = new BehaviorSubject<number>(this._linksCargados);
  private limiteImgs = 2000;
  private translation: Translation;
  private language: string;
  private headersColors = ['FFE5E7E9', 'FFF5B7B1', 'FFD4EFDF', 'FFABD5FF', 'FFE5E7E9'];
  private columnasLink;
  private inicioFilters = 5;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private excelService: ExcelService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
    private storage: AngularFireStorage,
    private anomaliaInfoService: AnomaliaInfoService,
    private downloadReportService: DownloadReportService,
    private anomaliaService: AnomaliaService
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

    this.subscriptions.add(
      this.plantaService
        .getPlanta(this.reportControlService.plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            this.planta = planta;

            this.allElems = this.reportControlService.allFilterableElements;

            return this.reportControlService.selectedInformeId$;
          })
        )
        .subscribe((informeId) => {
          this.informeSelected = this.reportControlService.informes.find((informe) => informeId === informe.id);

          // reseteamos con cada cambio de informe
          this.anomaliasInforme = [];

          if (this.reportControlService.plantaFija) {
            this.anomaliasInforme = (this.allElems as Anomalia[]).filter((anom) => anom.informeId === informeId);
          } else {
            const seguidoresInforme = (this.allElems as Seguidor[]).filter((seg) => seg.informeId === informeId);

            seguidoresInforme.forEach((seguidor) => {
              const anomaliasSeguidor = seguidor.anomaliasCliente;
              if (anomaliasSeguidor.length > 0) {
                this.anomaliasInforme.push(...anomaliasSeguidor);
              }
            });

            // ordenamos la lista de anomalias por tipo
            this.anomaliasInforme = this.anomaliaService.sortAnomsByTipo(this.anomaliasInforme);

            this.columnasLink = [2, 3];

            this.inicioFilters = 7;
          }

          // vaciamos el contenido con cada cambio de informe
          this.json = new Array(this.anomaliasInforme.length);

          // reseteamos el contador de filas
          this.linksCargados = 0;
        })
    );
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

    // incluimos urls de imagenes solo en seguidores y hasta cierto limite
    if (!this.reportControlService.plantaFija && this.anomaliasInforme.length < this.limiteImgs) {
      // con este contador impedimos que se descarge más de una vez debido a la suscripcion
      let downloads = 0;

      this.subscriptions.add(
        this.linksCargados$.subscribe((linksCargados) => {
          // indicamos el progreso en la barra de progreso
          this.downloadReportService.progressBarValue = Math.round(
            (linksCargados / this.anomaliasInforme.length) * 100
          );

          // cuando esten todas las filas cargadas descargamos el excel
          if (linksCargados / 2 === this.anomaliasInforme.length && downloads === 0) {
            this.downloadExcel();

            // reseteamos el contador de filas
            this.linksCargados = 0;

            downloads++;
          }
        })
      );
    } else {
      this.downloadExcel();
    }
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
  }

  private getColumnas() {
    this.columnas[0].push('ID');

    if (!this.reportControlService.plantaFija && this.anomaliasInforme.length < this.limiteImgs) {
      this.columnas[0].push(this.translation.t('Imagen térmica'));
      this.columnas[0].push(this.translation.t('Imagen visual'));
    }

    if (!this.reportControlService.plantaFija) {
      this.columnas[1].push(this.translation.t('Temperatura referencia') + ' (ºC)');
    }

    this.columnas[1].push(this.translation.t('Temperatura máxima') + ' (ºC)');
    this.columnas[1].push(this.translation.t('Gradiente temp. Normalizado') + ' (ºC)');
    this.columnas[1].push(this.translation.t('Categoría'));
    this.columnas[1].push('CoA');
    this.columnas[1].push(this.translation.t('Criticidad'));

    if (this.reportControlService.plantaFija) {
      this.columnas[2].push(this.translation.t('Localización'));
    } else {
      this.columnas[2].push(this.translation.t('Seguidor'));
    }

    this.columnas[2].push(this.translation.t('Fila'));
    this.columnas[2].push(this.translation.t('Columna'));
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

    // this.columnas = [
    //   // { id: 'urlMaps', nombre: 'Google maps' },
    // ];
  }

  private getRowData(anomalia: Anomalia, index: number) {
    const row: Fila = {};

    let localId;
    if (anomalia.hasOwnProperty('localId')) {
      localId = anomalia.localId;
    } else {
      localId = this.anomaliaService.getLocalId(anomalia);
    }
    row.localId = localId;
    if (!this.reportControlService.plantaFija && this.anomaliasInforme.length < this.limiteImgs) {
      row.thermalImage = null;
      row.visualImage = null;
    }
    if (!this.reportControlService.plantaFija) {
      row.temperaturaRef = Number(this.decimalPipe.transform(anomalia.temperaturaRef, '1.2-2'));
    }
    row.temperaturaMax = Number(this.decimalPipe.transform(anomalia.temperaturaMax, '1.2-2'));
    row.gradienteNormalizado = Number(this.decimalPipe.transform(anomalia.gradienteNormalizado, '1.2-2'));
    row.tipo = this.anomaliaInfoService.getTipoLabel(anomalia);
    row.clase = anomalia.clase;
    row.criticidad = this.anomaliaInfoService.getCriticidadLabel(anomalia);
    // row.urlMaps = 'Google maps';

    if (this.reportControlService.plantaFija) {
      row.localizacion = this.anomaliaInfoService.getLocalizacionReducLabel(anomalia, this.planta);
    } else {
      row.localizacion = anomalia.nombreSeguidor;
    }

    row.localY = anomalia.localY;
    row.localX = anomalia.localX;

    let datetime = anomalia.datetime;
    if (this.informeSelected.correccHoraSrt !== undefined) {
      datetime += this.informeSelected.correccHoraSrt * 3600;
    }
    row.datetime = this.datePipe.transform(datetime * 1000, 'dd/MM/yyyy HH:mm:ss');
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

    if (!this.reportControlService.plantaFija && this.anomaliasInforme.length < this.limiteImgs) {
      this.storage
        .ref(`informes/${this.informeSelected.id}/jpg/${(anomalia as PcInterface).archivoPublico}`)
        .getDownloadURL()
        .toPromise()
        .then((urlThermal) => {
          row.thermalImage = urlThermal;

          if (row.visualImage !== undefined) {
            this.json[index] = row;
          }

          this.linksCargados++;
        })
        .catch((err) => {
          row.thermalImage = null;

          console.log(err);

          this.linksCargados++;
        });

      this.storage
        .ref(`informes/${this.informeSelected.id}/jpgVisual/${(anomalia as PcInterface).archivoPublico}`)
        .getDownloadURL()
        .toPromise()
        .then((urlVisual) => {
          row.visualImage = urlVisual;

          if (row.thermalImage !== undefined) {
            this.json[index] = row;
          }

          this.linksCargados++;
        })
        .catch((err) => {
          row.visualImage = null;

          console.log(err);

          this.linksCargados++;
        });
    } else {
      this.json[index] = row;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////

  get linksCargados(): number {
    return this._linksCargados;
  }

  set linksCargados(value: number) {
    this._linksCargados = value;
    this.linksCargados$.next(value);
  }
}
