import { Component, OnInit } from '@angular/core';

import { ExcelService } from '@core/services/excel.service';

@Component({
  selector: 'app-download-excel',
  templateUrl: './download-excel.component.html',
  styleUrls: ['./download-excel.component.css'],
})
export class DownloadExcelComponent implements OnInit {
  private json = [{ 1: 'hola', 2: 'que', 3: 'tal' }];
  private excelFileName;
  private columnas = [
    'localId',
    'visualImage',
    'thermalImage',
    'temperaturaRef',
    'temperaturaMax',
    'gradienteNormalizado',
    'tipo',
    'clase',
    'urlMaps',
    'localizacion',
    'localY',
    'localX',
    'irradiancia',
    'datetime',
    'lugar',
    'nubosidad',
    'temperaturaAire',
    'emisividad',
    'temperaturaReflejada',
    'vientoVelocidad',
    'vientoDirección',
    'camaraModelo',
    'camaraSN',
    'modulo',
    'numModsAfeactados',
  ];
  private headersArray = [];
  private sheetName = 'Resultados';

  constructor(private excelService: ExcelService) {}

  ngOnInit(): void {}

  downloadExcel(): void {
    this.excelService.exportAsExcelFile('Título', [1, 2, 3], this.json, this.excelFileName, this.sheetName);
  }
}
