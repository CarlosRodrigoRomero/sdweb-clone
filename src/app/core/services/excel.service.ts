import { Injectable } from '@angular/core';

import { Workbook } from 'exceljs';
import * as FileSaver from 'file-saver';

import { ReportControlService } from './report-control.service';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8';
const EXCEL_EXT = '.xlsx';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor(private reportControlService: ReportControlService) {}

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

    // añadimos las cabeceras de las columnas
    const headeRow = worksheet.addRow(header);

    // estilos de la cabeceras de las columnas
    let seccion1 = 3;
    if (this.reportControlService.plantaFija) {
      seccion1 = 1;
    }
    let seccion2 = 9;
    if (this.reportControlService.plantaFija) {
      seccion2 = 7;
    }
    let seccion3 = 14;
    if (this.reportControlService.plantaFija) {
      seccion3 = 12;
    }

    headeRow.eachCell((cell, index) => {
      if (index <= seccion1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE5E7E9' },
        };
      } else if (index <= seccion2) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5B7B1' },
        };
      } else if (index <= seccion3) {
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

    // congelamos la primera filas
    worksheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];

    // obtenemos todas las columnas
    let columnsArray: any[];
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        columnsArray = Object.keys(json[key]);
      }
    }

    // añadimos todos las filas de anomalias
    data.forEach((element: any) => {
      const eachRow = [];
      columnsArray.forEach((column) => {
        if (column === 'thermalImage' || column === 'visualImage') {
          if (element[column] !== null) {
            eachRow.push({ text: 'link', hyperlink: element[column] });
          } else {
            eachRow.push('');
          }
        } else {
          eachRow.push(element[column]);
        }
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

    // centramos texto filas datos
    worksheet.getRows(2, worksheet.rowCount).forEach((row) => {
      row.alignment = { horizontal: 'center' };
    });

    // aplicamos estilos a los links
    if (!this.reportControlService.plantaFija) {
      worksheet.getColumn(2).eachCell((cell, index) => {
        // no aplicamos a las cabeceras
        if (index > 1) {
          this.applyLinkStyle(cell);
        }
      });
      worksheet.getColumn(3).eachCell((cell, index) => {
        // no aplicamos a las cabeceras
        if (index > 1) {
          this.applyLinkStyle(cell);
        }
      });
    }

    // filtros
    worksheet.getColumn(2).worksheet.autoFilter = 'G2:H' + worksheet.rowCount.toString();
    worksheet.autoFilter = 'K2:L' + worksheet.rowCount.toString();
    worksheet.autoFilter = 'X2:X' + worksheet.rowCount.toString();

    // guardamos el archivo excel
    workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
      const blob = new Blob([data], { type: EXCEL_TYPE });
      FileSaver.saveAs(blob, excelFileName + EXCEL_EXT);
    });
  }

  private applyLinkStyle(cell) {
    const linkStyle = {
      underline: true,
      color: { argb: 'FF0000FF' },
    };

    if (cell) {
      cell.font = linkStyle;
    }
  }

  private numToAlpha(num: number) {
    let alpha = '';

    for (; num >= 0; num = parseInt((num / 26).toString(), 10) - 1) {
      alpha = String.fromCharCode((num % 26) + 0x41) + alpha;
    }

    return alpha;
  }
}
