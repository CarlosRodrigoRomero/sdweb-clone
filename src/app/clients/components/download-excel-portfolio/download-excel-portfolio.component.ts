import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { ExcelService } from '@core/services/excel.service';
import { GLOBAL } from '@core/services/global';

@Component({
  selector: 'app-download-excel-portfolio',
  templateUrl: './download-excel-portfolio.component.html',
  styleUrls: ['./download-excel-portfolio.component.css'],
  providers: [DatePipe],
})
export class DownloadExcelPortfolioComponent implements OnInit {
  userDemo = false;
  private columnas: string[][] = [
    ['Nombre planta', 'Fecha inspección', 'Potencia (MW)', 'Tipo', 'MAE (%)', 'Nº total anomalías'],
    ['Células calientes (%)', 'Nº total céls. calientes'],
    [],
  ];
  private columnasNoUtilizadas: number[] = [0, 1, 2, 4, 13, 16];
  private headersColors = ['FFE5E7E9', 'FFF5B7B1', 'FFD4EFDF'];
  private filas: any[] = [];
  private sheetName = 'Portfolio';
  private excelFileName = 'Portfolio';

  constructor(
    private portfolioControlService: PortfolioControlService,
    private excelService: ExcelService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    if (this.portfolioControlService.user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2') {
      this.userDemo = true;
    }

    this.portfolioControlService.criterioCriticidad.rangosDT.forEach((rango, index, rangos) => {
      let columna: string;
      if (index < rangos.length - 1) {
        columna = 'Cels. calientes ' + rango + ' - ' + rangos[index + 1] + 'ºC';
      } else {
        columna = 'Cels. calientes >' + rango + 'ºC';
      }

      this.columnas[1].push(columna);
    });

    GLOBAL.labels_tipos.forEach((tipo, index) => {
      if (!this.columnasNoUtilizadas.includes(index) && index !== 8 && index !== 9) {
        this.columnas[2].push(tipo);
      }
    });
  }

  getPortfolioData() {
    // reseteamos el contenido
    this.filas = [];

    const plantas = this.portfolioControlService.listaPlantas;
    const informes = this.portfolioControlService.listaInformes.filter((informe) =>
      informe.hasOwnProperty('tiposAnomalias')
    );

    plantas.forEach((planta) => {
      // nos quedamos solo con los informe de la planta que tengan 'tiposAnomalias'
      const informesPlanta = informes.filter((informe) => informe.plantaId === planta.id);

      informesPlanta.forEach((informe) => {
        const fila = {
          nombre: planta.nombre,
          fechaInspeccion: this.datePipe.transform(informe.fecha * 1000, 'dd/MM/yyyy'),
          potencia: planta.potencia,
          tipo: planta.tipo,
          mae: Math.round(informe.mae * 10000) / 100,
        };

        let numAnomalias = 0;
        let ccTotales = 0;
        const tiposAnomalias = Object.values(informe.tiposAnomalias);
        tiposAnomalias.forEach((value, index) => {
          if (index === 8 || index === 9) {
            value.forEach((element) => {
              numAnomalias += element;
              ccTotales += element;
            });
          } else {
            numAnomalias += value;
          }
        });

        fila['numAnomalias'] = numAnomalias;

        let cc = null;
        if (informe.hasOwnProperty('cc') && informe.cc !== null && !isNaN(informe.cc)) {
          cc = Math.round(informe.cc * 10000) / 100;
        }
        fila['cc'] = cc;

        fila['ccTotales'] = ccTotales;

        this.portfolioControlService.criterioCriticidad.rangosDT.forEach((_, index) => {
          const ccsRango = informe.tiposAnomalias[8][index] + informe.tiposAnomalias[9][index];
          fila['cc' + (index + 1)] = ccsRango;
        });

        GLOBAL.labels_tipos.forEach((_, index) => {
          if (!this.columnasNoUtilizadas.includes(index) && index !== 8 && index !== 9) {
            fila['tipo' + index] = informe.tiposAnomalias[index];
          }
        });

        this.filas.push(fila);

        if (this.filas.length === informes.length) {
          this.downloadExcel();
        }
      });
    });
  }

  private downloadExcel() {
    this.excelService.exportAsExcelFile(
      this.columnas,
      this.headersColors,
      this.filas,
      this.excelFileName,
      this.sheetName,
      undefined
    );
  }
}
