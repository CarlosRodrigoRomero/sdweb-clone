import { Component, OnInit } from '@angular/core';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { ExcelService } from '@core/services/excel.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';
import { GLOBAL } from '@core/services/global';

@Component({
  selector: 'app-download-excel-portfolio',
  templateUrl: './download-excel-portfolio.component.html',
  styleUrls: ['./download-excel-portfolio.component.css'],
})
export class DownloadExcelPortfolioComponent implements OnInit {
  userDemo = false;
  private columnas = [
    ['Nombre planta', 'Fecha inspección', 'Potencia (MW)', 'Tipo', 'MAE (%)', 'Nº total anomalías'],
    ['Células calientes (%)', 'Nº total céls. calientes'],
    [],
  ];
  private headersColors = ['FFE5E7E9', 'FFF5B7B1', 'FFD4EFDF'];
  private filas: any[] = [];
  private sheetName = 'Portfolio';
  private excelFileName = 'Portfolio';

  constructor(private portfolioControlService: PortfolioControlService, private excelService: ExcelService) {}

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
      if (index !== 0 && index !== 8 && index !== 9) {
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
          fechaInspeccion: informe.fecha.toString(),
          potencia: planta.potencia,
          tipo: planta.tipo,
          mae: informe.mae,
        };

        fila['numAnomalias'] = '';

        fila['cc'] = informe.cc;

        fila['ccTotales'] = '';

        this.portfolioControlService.criterioCriticidad.rangosDT.forEach((_, index) => {
          const ccsRango = informe.tiposAnomalias[8][index] + informe.tiposAnomalias[9][index];
          fila['cc' + (index + 1)] = ccsRango;
        });

        GLOBAL.labels_tipos.forEach((_, index) => {
          if (index !== 0 && index !== 8 && index !== 9) {
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
      0
    );
  }
}
