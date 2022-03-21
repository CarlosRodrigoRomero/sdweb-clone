import { Injectable } from '@angular/core';

import { AutoFilter, CellValue, Workbook } from 'exceljs';
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
    headersArray: string[][],
    headersColors: string[],
    json: any[],
    excelFileName: string,
    sheetName: string,
    columnasLink?: number[],
    columnasFormula?: number[],
    formulas?: string[],
    inicioFilters?: number
  ) {
    const header: string[] = [];
    headersArray.forEach((array) => header.push(...array));
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
    let initColor = 1;
    headersArray.forEach((section, i) => {
      headeRow.eachCell((cell, index) => {
        if (index >= initColor && index <= initColor + section.length) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: headersColors[i] },
          };
        }

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        cell.font = { size: 12 };

        worksheet.getColumn(index).width =
          header[index - 1].length < 20 ? 20 : header[index - 1].length > 25 ? 25 : header[index - 1].length;

        headeRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      initColor += section.length;
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
        if (column === 'thermalImage' || column === 'visualImage' || column === 'urlMaps') {
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
    if (columnasLink !== undefined) {
      columnasLink.forEach((columna) => {
        worksheet.getColumn(columna).eachCell((cell, index) => {
          // no aplicamos a las cabeceras
          if (index > 1) {
            this.applyLinkStyle(cell);
          }
        });
      });
    }

    // añadimos las formulas
    if (columnasFormula !== undefined) {
      columnasFormula.forEach((columna, i) => {
        worksheet.getColumn(columna).eachCell((cell, index) => {
          if (index > 1) {
            const formula = formulas[i].split('#').join(`${index}`);

            cell.value = { formula } as CellValue;
          }
        });
      });
    }

    // añadimos los filtros
    if (inicioFilters !== undefined) {
      worksheet.autoFilter = `${this.numToAlpha(inicioFilters - 1)}1:${this.numToAlpha(
        inicioFilters - 1 + 5
      )}${worksheet.rowCount.toString()}`;
      // worksheet.autoFilter = `${this.numToAlpha(header.length)}1:${this.numToAlpha(header.length)}${
      //   worksheet.rowCount
      // }`;
      // worksheet.autoFilter = 'V1:V' + worksheet.rowCount.toString();
    }

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

  numToAlpha(num: number) {
    let alpha = '';

    for (; num >= 0; num = parseInt((num / 26).toString(), 10) - 1) {
      alpha = String.fromCharCode((num % 26) + 0x41) + alpha;
    }

    return alpha;
  }
}
