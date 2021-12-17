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

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { GLOBAL } from '@core/services/global';
import { ModuloInterface } from '@core/models/modulo';
import { PcInterface } from '@core/models/pc';
import { FilterableElement } from '@core/models/filterableInterface';

import { Translation } from '@shared/utils/translations/translations';

interface Columna {
  id: string;
  nombre: string;
}

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
  // irradiancia?: number;
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
  private excelFileName = 'Informe';
  private columnas: Columna[] = [];
  private sheetName = 'Resultados';
  private anomaliasInforme: Anomalia[] = [];
  private informeSelected: InformeInterface;
  private sheetTitle = 'Inspección termográfica ';
  private planta: PlantaInterface;
  private allElems: FilterableElement[];
  private _filasCargadas = 0;
  private filasCargadas$ = new BehaviorSubject<number>(this._filasCargadas);
  private limiteImgs = 2000;
  private translation: Translation;
  private language: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private excelService: ExcelService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
    private storage: AngularFireStorage,
    private anomaliaInfoService: AnomaliaInfoService,
    private downloadReportService: DownloadReportService
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

            this.sheetTitle = this.sheetTitle + planta.nombre;

            return this.reportControlService.selectedInformeId$;
          })
        )
        .subscribe((informeId) => {
          this.informeSelected = this.reportControlService.informes.find((informe) => informeId === informe.id);

          this.sheetTitle =
            this.sheetTitle + ' (' + this.datePipe.transform(this.informeSelected.fecha * 1000, 'dd/MM/yyyy ') + ')';

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
          }

          // vaciamos el contenido con cada cambio de informe
          this.json = new Array(this.anomaliasInforme.length);

          // reseteamos el contador de filas
          this.filasCargadas = 0;
        })
    );
  }

  checkDownloadType() {
    this.translation = new Translation(this.language);

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
        this.filasCargadas$.subscribe((filasCargadas) => {
          // indicamos el progreso en la barra de progreso
          this.downloadReportService.progressBarValue = Math.round(
            (filasCargadas / this.anomaliasInforme.length) * 100
          );

          // cuando esten todas las filas cargadas descargamos el excel
          if (filasCargadas === this.anomaliasInforme.length && downloads === 0) {
            this.downloadExcel();

            // reseteamos el contador de filas
            this.filasCargadas = 0;

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
      this.sheetTitle,
      this.columnas.map((col) => col.nombre),
      this.json,
      this.excelFileName,
      this.sheetName,
      this.limiteImgs
    );

    // ocultamos la barra de progreso
    this.downloadReportService.generatingDownload = false;
  }

  private getColumnas() {
    this.columnas = [{ id: 'localId', nombre: 'ID' }];

    if (!this.reportControlService.plantaFija && this.anomaliasInforme.length < this.limiteImgs) {
      this.columnas.push(
        { id: 'thermalImage', nombre: this.translation.t('Imagen térmica') },
        { id: 'visualImage', nombre: this.translation.t('Imagen visual') }
      );
    }

    this.columnas.push(
      { id: 'temperaturaRef', nombre: this.translation.t('Temperatura referencia') + ' (ºC)' },
      { id: 'temperaturaMax', nombre: this.translation.t('Temperatura máxima') + ' (ºC)' },
      { id: 'gradienteNormalizado', nombre: this.translation.t('Gradiente temp. Normalizado') + ' (ºC)' },
      { id: 'tipo', nombre: this.translation.t('Categoría') },
      { id: 'clase', nombre: 'CoA' },
      { id: 'criticidad', nombre: this.translation.t('Criticidad') }
    );

    if (this.reportControlService.plantaFija) {
      this.columnas.push({ id: 'localizacion', nombre: this.translation.t('Localización') });
    } else {
      this.columnas.push({ id: 'localizacion', nombre: this.translation.t('Seguidor') });
    }

    this.columnas.push(
      { id: 'localY', nombre: this.translation.t('Fila') },
      { id: 'localX', nombre: this.translation.t('Columna') },
      { id: 'datetime', nombre: this.translation.t('Fecha y hora') },
      { id: 'lugar', nombre: this.translation.t('Lugar') },
      { id: 'nubosidad', nombre: this.translation.t('Nubosidad (octavas)') },
      { id: 'temperaturaAire', nombre: this.translation.t('Temperatura ambiente') + ' (ºC)' },
      { id: 'emisividad', nombre: this.translation.t('Emisividad') },
      { id: 'temperaturaReflejada', nombre: this.translation.t('Temperatura reflejada') + ' (ºC)' }
    );

    if (this.informeSelected.hasOwnProperty('vientoVelocidad')) {
      this.columnas.push(
        { id: 'vientoVelocidad', nombre: this.translation.t('Velocidad viento') + ' (Beaufort)' },
        { id: 'vientoDirección', nombre: this.translation.t('Dirección viento') + ' (º)' }
      );
    } else if (this.informeSelected.hasOwnProperty('viento')) {
      this.columnas.push({ id: 'viento', nombre: this.translation.t('Viento') });
    }

    if (this.informeSelected.hasOwnProperty('camara')) {
      this.columnas.push({ id: 'camaraModelo', nombre: this.translation.t('Cámara térmica y visual') });
    }
    if (this.informeSelected.hasOwnProperty('camaraSN')) {
      this.columnas.push({ id: 'camaraSN', nombre: this.translation.t('Número de serie cámara') });
    }

    this.columnas.push({ id: 'modulo', nombre: this.translation.t('Módulo') });

    // this.columnas = [
    //   // { id: 'urlMaps', nombre: 'Google maps' },
    //   // { id: 'irradiancia', nombre: 'Irradiancia (W/m2)' },
    //   // { id: 'numModsAfeactados', nombre: 'Número de módulos afectados' },
    // ];
  }

  private getRowData(anomalia: Anomalia, index: number) {
    const row: Fila = {};

    row.localId = anomalia.localId;
    if (!this.reportControlService.plantaFija && this.anomaliasInforme.length < this.limiteImgs) {
      row.thermalImage = null;
      row.visualImage = null;
    }
    row.temperaturaRef = Number(this.decimalPipe.transform(anomalia.temperaturaRef, '1.2-2'));
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
    // row.irradiancia = 0;
    row.datetime = this.datePipe.transform(anomalia.datetime * 1000, 'dd/MM/yyyy HH:mm:ss');
    row.lugar = this.planta.nombre;
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
        })
        .catch((err) => console.log(err));

      this.storage
        .ref(`informes/${this.informeSelected.id}/jpgVisual/${(anomalia as PcInterface).archivoPublico}`)
        .getDownloadURL()
        .toPromise()
        .then((urlVisual) => {
          row.visualImage = urlVisual;

          this.json[index] = row;

          this.filasCargadas++;
        })
        .catch((err) => {
          console.log(err);

          this.filasCargadas++;
        });
    } else {
      this.json[index] = row;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////

  get filasCargadas(): number {
    return this._filasCargadas;
  }

  set filasCargadas(value: number) {
    this._filasCargadas = value;
    this.filasCargadas$.next(value);
  }
}
