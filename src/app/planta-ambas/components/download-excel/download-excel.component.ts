import { Component, OnInit } from '@angular/core';

import * as XLSX from 'xlsx';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8';
const EXCEL_EXT = '.xlsx';

@Component({
  selector: 'app-download-excel',
  templateUrl: './download-excel.component.html',
  styleUrls: ['./download-excel.component.css'],
})
export class DownloadExcelComponent implements OnInit {
  private json = [{ 1: 'hola', 2: 'que', 3: 'tal' }];
  private excelFileName = 'excel';

  constructor() {}

  ngOnInit(): void {}

  downloadExcel(): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.json);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };

    // guardamos el archivo
    XLSX.writeFile(workbook, this.excelFileName);
  }
}
