import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { AngularFireStorage } from '@angular/fire/storage';

import { switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';

import { ExcelService } from '@core/services/excel.service';
import { ReportControlService } from '@core/services/report-control.service';
import { PlantaService } from '@core/services/planta.service';
import { AnomaliaInfoService } from '@core/services/anomalia-info.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { GLOBAL } from '@core/services/global';
import { ModuloInterface } from '@core/models/modulo';
import { PcInterface } from '@core/models/pc';
import { FilterableElement } from '@core/models/filterableInterface';

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
  // numModsAfeactados?: number;
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

  private subscriptions: Subscription = new Subscription();

  constructor(
    private excelService: ExcelService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
    private storage: AngularFireStorage,
    private anomaliaInfoService: AnomaliaInfoService
  ) {}

  ngOnInit(): void {
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

          this.getColumnas();

          this.sheetTitle =
            this.sheetTitle + ' (' + this.datePipe.transform(this.informeSelected.fecha * 1000, 'dd/MM/yyyy ') + ')';

          // si tiene prefijo le ponemos ese nombre
          if (this.informeSelected.hasOwnProperty('prefijo')) {
            this.excelFileName = this.informeSelected.prefijo.concat('informe');
          }

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
          this.json = [];

          // reseteamos el contador de filas
          this.filasCargadas = 0;

          this.anomaliasInforme.forEach((anom) => this.getRowData(anom));
        })
    );
  }

  checkDownloadType() {
    if (this.reportControlService.plantaFija) {
      this.downloadExcel();
    } else {
      // con este contador impedimos que se descarge más de una vez debido a la suscripcion
      let downloads = 0;

      this.subscriptions.add(
        this.filasCargadas$.subscribe((filasCargadas) => {
          if (filasCargadas === this.anomaliasInforme.length && downloads === 0) {
            this.downloadExcel();

            // reseteamos el contador de filas
            this.filasCargadas = 0;

            downloads++;
          }
        })
      );
    }
  }

  private downloadExcel(): void {
    this.excelService.exportAsExcelFile(
      this.sheetTitle,
      this.columnas.map((col) => col.nombre),
      this.json,
      this.excelFileName,
      this.sheetName
    );
  }

  private getColumnas() {
    this.columnas = [{ id: 'localId', nombre: 'ID' }];

    if (!this.reportControlService.plantaFija) {
      this.columnas.push(
        { id: 'thermalImage', nombre: 'Imagen térmica' },
        { id: 'visualImage', nombre: 'Imagen visual' }
      );
    }

    this.columnas.push(
      { id: 'temperaturaRef', nombre: 'Temp. de referencia (ºC)' },
      { id: 'temperaturaMax', nombre: 'Temp. máxima módulo (ºC)' },
      { id: 'gradienteNormalizado', nombre: 'Gradiente de temperatura (ºC)' },
      { id: 'tipo', nombre: 'Categoría' },
      { id: 'clase', nombre: 'CoA' },
      { id: 'criticidad', nombre: 'Criticidad' }
    );

    if (this.reportControlService.plantaFija) {
      this.columnas.push({ id: 'localizacion', nombre: 'Localización' });
    } else {
      this.columnas.push({ id: 'localizacion', nombre: 'Seguidor' });
    }

    this.columnas.push(
      { id: 'localY', nombre: 'Fila' },
      { id: 'localX', nombre: 'Columna' },
      { id: 'datetime', nombre: 'Fecha y hora' },
      { id: 'lugar', nombre: 'Lugar' },
      { id: 'nubosidad', nombre: 'Nubosidad (octavas)' },
      { id: 'temperaturaAire', nombre: 'Temperatura ambiente (ºC)' },
      { id: 'emisividad', nombre: 'Emisividad' },
      { id: 'temperaturaReflejada', nombre: 'Temperatura reflejada (ºC)' }
    );

    if (this.informeSelected.hasOwnProperty('vientoVelocidad')) {
      this.columnas.push(
        { id: 'vientoVelocidad', nombre: 'Velocidad viento (Beaufort)' },
        { id: 'vientoDirección', nombre: 'Dirección viento (º)' }
      );
    } else if (this.informeSelected.hasOwnProperty('viento')) {
      this.columnas.push({ id: 'viento', nombre: 'Viento' });
    }

    if (this.informeSelected.hasOwnProperty('camara')) {
      this.columnas.push({ id: 'camaraModelo', nombre: 'Cámara térmica y visual' });
    }
    if (this.informeSelected.hasOwnProperty('camaraSN')) {
      this.columnas.push({ id: 'camaraSN', nombre: 'Número de serie cámara térmica' });
    }

    this.columnas.push({ id: 'modulo', nombre: 'Módulo' });

    // this.columnas = [
    //   // { id: 'urlMaps', nombre: 'Google maps' },
    //   // { id: 'irradiancia', nombre: 'Irradiancia (W/m2)' },
    //   // { id: 'numModsAfeactados', nombre: 'Número de módulos afectados' },
    // ];
  }

  private getRowData(anomalia: Anomalia) {
    const row: Fila = {};

    row.localId = anomalia.localId;
    if (!this.reportControlService.plantaFija) {
      row.thermalImage = null;
      row.visualImage = null;
    }
    row.temperaturaRef = Number(this.decimalPipe.transform(anomalia.temperaturaRef, '1.2-2'));
    row.temperaturaMax = Number(this.decimalPipe.transform(anomalia.temperaturaMax, '1.2-2'));
    row.gradienteNormalizado = Number(this.decimalPipe.transform(anomalia.gradienteNormalizado, '1.2-2'));
    row.tipo = GLOBAL.labels_tipos[anomalia.tipo];
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

    row.modulo = this.getModuloLabel(anomalia.modulo);
    // row.numModsAfeactados = 1;

    if (this.reportControlService.plantaFija) {
      this.json.push(row);
    } else {
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

          this.json.push(row);

          this.filasCargadas++;
        })
        .catch((err) => {
          console.log(err);

          this.filasCargadas++;
        });
    }
  }

  private getModuloLabel(modulo: ModuloInterface): string {
    let moduloLabel: string;
    if (modulo !== undefined && modulo !== null) {
      if (modulo.marca === undefined) {
        if (modulo.modelo === undefined) {
          moduloLabel = '(' + modulo.potencia + 'W)';
        } else {
          moduloLabel = modulo.modelo + ' (' + modulo.potencia + 'W)';
        }
      } else {
        if (modulo.modelo === undefined) {
          moduloLabel = modulo.marca + ' (' + modulo.potencia + 'W)';
        } else {
          moduloLabel = modulo.marca + ' ' + modulo.modelo + ' (' + modulo.potencia + 'W)';
        }
      }
    } else {
      moduloLabel = 'Desconocido';
    }

    return moduloLabel;
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
