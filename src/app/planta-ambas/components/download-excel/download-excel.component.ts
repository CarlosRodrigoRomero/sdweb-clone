import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { AngularFireStorage } from '@angular/fire/storage';

import { switchMap, take } from 'rxjs/operators';

import { ExcelService } from '@core/services/excel.service';
import { ReportControlService } from '@core/services/report-control.service';
import { PlantaService } from '@core/services/planta.service';

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
  camaraModelo?: string;
  camaraSN?: number;
  modulo?: string;
  numModsAfeactados?: number;
}

@Component({
  selector: 'app-download-excel',
  templateUrl: './download-excel.component.html',
  styleUrls: ['./download-excel.component.css'],
  providers: [DatePipe, DecimalPipe],
})
export class DownloadExcelComponent implements OnInit {
  private json: any[] = [];
  private excelFileName = 'Informe';
  private columnas: Columna[] = [
    { id: 'localId', nombre: 'ID' },
    { id: 'thermalImage', nombre: 'Imagen térmica' },
    { id: 'visualImage', nombre: 'Imagen visual' },
    { id: 'temperaturaRef', nombre: 'Temperatura de referencia (ºC)' },
    { id: 'temperaturaMax', nombre: 'Temperatura máxima módulo (ºC)' },
    { id: 'gradienteNormalizado', nombre: 'Gradiente de temperatura (ºC)' },
    { id: 'tipo', nombre: 'Categoría' },
    { id: 'clase', nombre: 'Clase de Anomalía' },
    // { id: 'urlMaps', nombre: 'Google maps' },
    { id: 'localizacion', nombre: 'Seguidor' },
    { id: 'localY', nombre: 'Fila' },
    { id: 'localX', nombre: 'Columna' },
    { id: 'irradiancia', nombre: 'Irradiancia (W/m2)' },
    { id: 'datetime', nombre: 'Fecha y hora' },
    { id: 'lugar', nombre: 'Lugar' },
    { id: 'nubosidad', nombre: 'Nubosidad (octavas)' },
    { id: 'temperaturaAire', nombre: 'Temperatura ambiente (ºC)' },
    { id: 'emisividad', nombre: 'Emisividad' },
    { id: 'temperaturaReflejada', nombre: 'Temperatura reflejada (ºC)' },
    { id: 'vientoVelocidad', nombre: 'Velocidad viento (Beaufort)' },
    { id: 'vientoDirección', nombre: 'Dirección viento (º)' },
    { id: 'camaraModelo', nombre: 'Cámara térmica y visual' },
    { id: 'camaraSN', nombre: 'Número de serie cámara térmica' },
    { id: 'modulo', nombre: 'Módulo' },
    { id: 'numModsAfeactados', nombre: 'Número de módulos afectados' },
  ];
  private sheetName = 'Resultados';
  private anomaliasInforme: Anomalia[] = [];
  private informe: InformeInterface;
  private sheetTitle = 'Inspección termográfica ';
  private planta: PlantaInterface;
  private allElems: FilterableElement[];

  constructor(
    private excelService: ExcelService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
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
        this.informe = this.reportControlService.informes.find((informe) => informeId === informe.id);

        this.sheetTitle =
          this.sheetTitle + ' (' + this.datePipe.transform(this.informe.fecha * 1000, 'dd/MM/yyyy ') + ')';

        // si tiene prefijo le ponemos ese nombre
        if (this.informe.hasOwnProperty('prefijo')) {
          this.excelFileName = this.informe.prefijo.concat('informe');
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

        this.anomaliasInforme.forEach((anom) => this.getRowData(anom));
      });
  }

  downloadExcel(): void {
    this.excelService.exportAsExcelFile(
      this.sheetTitle,
      this.columnas.map((col) => col.nombre),
      this.json,
      this.excelFileName,
      this.sheetName
    );
  }

  private getRowData(anomalia: Anomalia) {
    const row: Fila = {};

    row.localId = anomalia.localId;
    row.thermalImage = null;
    row.visualImage = null;
    row.temperaturaRef = Number(this.decimalPipe.transform(anomalia.temperaturaRef, '1.2-2'));
    row.temperaturaMax = Number(this.decimalPipe.transform(anomalia.temperaturaMax, '1.2-2'));
    row.gradienteNormalizado = Number(this.decimalPipe.transform(anomalia.gradienteNormalizado, '1.2-2'));
    row.tipo = GLOBAL.labels_tipos[anomalia.tipo];
    row.clase = anomalia.clase;
    // row.urlMaps = 'Google maps';
    row.localizacion = anomalia.nombreSeguidor;
    row.localY = anomalia.localY;
    row.localX = anomalia.localX;
    row.irradiancia = 0;
    row.datetime = this.datePipe.transform(anomalia.datetime * 1000, 'dd/MM/yyyy HH:mm:ss');
    row.lugar = this.planta.nombre;
    row.nubosidad = this.informe.nubosidad;
    row.temperaturaAire = this.informe.temperatura;
    row.emisividad = this.informe.emisividad;
    row.temperaturaReflejada = this.informe.tempReflejada;
    row.vientoVelocidad = this.informe.vientoVelocidad;
    row.vientoDirección = this.informe.vientoDireccion;
    row.camaraModelo = this.informe.camara;
    row.camaraSN = this.informe.camaraSN;
    row.modulo = this.getModuloLabel(anomalia.modulo);
    row.numModsAfeactados = 1;

    this.storage
      .ref(`informes/${this.informe.id}/jpg/${(anomalia as PcInterface).archivoPublico}`)
      .getDownloadURL()
      .toPromise()
      .then((urlThermal) => {
        row.thermalImage = urlThermal;
      })
      .catch((err) => console.log(err));

    this.storage
      .ref(`informes/${this.informe.id}/jpgVisual/${(anomalia as PcInterface).archivoPublico}`)
      .getDownloadURL()
      .toPromise()
      .then((urlVisual) => {
        row.visualImage = urlVisual;

        this.json.push(row);
      })
      .catch((err) => console.log(err));
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

  private sortRow(row: Fila) {}
}
