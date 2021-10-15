import { Injectable } from '@angular/core';

import { Workbook } from 'exceljs';
import * as FileSaver from 'file-saver';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8';
const EXCEL_EXT = '.xlsx';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor() {}

  public exportAsExcelFile(
    reportHeading: string,
    headersArray: any[],
    json: any[],
    excelFileName: string,
    sheetName: string
  ) {
    const header = headersArray;
    const data = json;

    // creamos workbook y worksheet
    const workbook = new Workbook();
    workbook.creator = 'Solardrone';
    workbook.lastModifiedBy = 'Solardrone';
    workbook.created = new Date();
    workbook.modified = new Date();
    const worksheet = workbook.addWorksheet(sheetName);

    // añadimos la cabecera de la hora
    worksheet.addRow([]);
    worksheet.mergeCells('A1:' + this.numToAlpha(header.length - 1) + '1');
    worksheet.getCell('A1').value = reportHeading;
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A1').font = { size: 15, bold: true };

    // añadimos las cabeceras de las columnas
    const headeRow = worksheet.addRow(header);

    // estilos de la cabeceras de las columnas
    headeRow.eachCell((cell, index) => {
      if (index <= 3) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE5E7E9' },
        };
      } else if (index <= 8) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5B7B1' },
        };
      } else if (index <= 12) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD4EFDF' },
        };
      } else if (index <= header.length) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE5E7E9' },
        };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' },
        };
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.font = { size: 12 };

      worksheet.getColumn(index).width = header[index - 1].length < 20 ? 20 : header[index - 1].length;

      headeRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // obtenemos todas las columnas
    let columnsArray: any[];
    console.log(json);
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        columnsArray = Object.keys(json[key]);
      }
    }

    // añadimos todos las filas de anomalias
    data.forEach((element: any) => {
      const eachRow = [];
      columnsArray.forEach((column) => {
        eachRow.push(element[column]);
      });

      if (element.isDeleted === 'Y') {
        const deletedRow = worksheet.addRow(eachRow);
        deletedRow.eachCell((cell) => {
          cell.font = { name: 'Calibri', family: 4, size: 11, bold: false, strike: true };
        });
      } else {
        worksheet.addRow(eachRow);
      }
    });

    // centrado filas datos
    worksheet.getRows(3, worksheet.rowCount).forEach((cell) => {
      cell.alignment = { horizontal: 'center' };
    });

    // filtros
    worksheet.autoFilter = 'G2:H' + worksheet.rowCount.toString();
    worksheet.autoFilter = 'K2:L' + worksheet.rowCount.toString();
    worksheet.autoFilter = 'X2:X' + worksheet.rowCount.toString();

    // guardamos el archivo excel
    workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
      const blob = new Blob([data], { type: EXCEL_TYPE });
      FileSaver.saveAs(blob, excelFileName + EXCEL_EXT);
    });
  }

  private numToAlpha(num: number) {
    let alpha = '';

    for (; num >= 0; num = parseInt((num / 26).toString(), 10) - 1) {
      alpha = String.fromCharCode((num % 26) + 0x41) + alpha;
    }

    return alpha;
  }
}
