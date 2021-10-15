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

interface Columna {
  id: string;
  nombre: string;
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
    { id: 'visualImage', nombre: 'Imagen visual' },
    { id: 'thermalImage', nombre: 'Imagen térmica' },
    { id: 'temperaturaRef', nombre: 'Temperatura de referencia (ºC)' },
    { id: 'temperaturaMax', nombre: 'Temperatura máxima módulo (ºC)' },
    { id: 'gradienteNormalizado', nombre: 'Gradiente de temperatura (ºC)' },
    { id: 'tipo', nombre: 'Categoría' },
    { id: 'clase', nombre: 'Clase de Anomalía' },
    { id: 'urlMaps', nombre: 'Google maps' },
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

        if (this.reportControlService.plantaFija) {
          this.anomaliasInforme = (this.reportControlService.allFilterableElements as Anomalia[]).filter(
            (anom) => anom.informeId === informeId
          );
        } else {
          const seguidoresInforme = (this.reportControlService.allFilterableElements as Seguidor[]).filter(
            (seg) => seg.informeId === informeId
          );

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
    const row: any[] = [];

    this.storage
      .ref(`informes/${this.informe.id}/jpg/${(anomalia as PcInterface).archivoPublico}`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        row.push(anomalia.localId);
        row.push('Imagen visual');
        row.push(url);
        row.push(this.decimalPipe.transform(anomalia.temperaturaRef, '1.2-2'));
        row.push(this.decimalPipe.transform(anomalia.temperaturaMax, '1.2-2'));
        row.push(this.decimalPipe.transform(anomalia.gradienteNormalizado, '1.2-2'));
        row.push(GLOBAL.labels_tipos[anomalia.tipo]);
        row.push(anomalia.clase);
        row.push('Google maps');
        row.push('Seguidor');
        row.push(anomalia.localY);
        row.push(anomalia.localX);
        row.push('Irradiancia');
        row.push(this.datePipe.transform(anomalia.datetime * 1000, 'dd/MM/yyyy HH:mm:ss'));
        row.push(this.planta.nombre);
        row.push(this.informe.nubosidad);
        row.push(this.informe.temperatura);
        row.push(this.informe.emisividad);
        row.push(this.informe.tempReflejada);
        row.push(this.informe.vientoVelocidad);
        row.push(this.informe.vientoDireccion);
        row.push(this.informe.camara);
        row.push(this.informe.camaraSN);
        row.push(this.getModuloLabel(anomalia.modulo));
        row.push(1);

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
}
