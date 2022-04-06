import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { switchMap, take } from 'rxjs/operators';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { ExcelService } from '@core/services/excel.service';
import { GLOBAL } from '@core/services/global';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';

import { ReportControlService } from '@core/services/report-control.service';
import { CritCriticidad } from '@core/models/critCriticidad';

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
    private datePipe: DatePipe,
    private anomaliaService: AnomaliaService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    if (this.portfolioControlService.user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2') {
      this.userDemo = true;
    }

    this.portfolioControlService.criterioCriticidad.rangosDT.forEach((rango, index, rangos) => {
      let columna: string;
      if (index < rangos.length - 1) {
        columna = 'Cels. calientes por ΔT Max (norm) ' + rango + ' - ' + rangos[index + 1] + 'ºC';
      } else {
        columna = 'Cels. calientes por ΔT Max (norm) >' + rango + 'ºC';
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
    const informes = this.portfolioControlService.listaInformes.filter(
      (informe) => informe.hasOwnProperty('tiposAnomalias') && informe.tiposAnomalias[0] !== undefined
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
        };

        let mae = 0;
        if (informe.fecha < GLOBAL.newReportsDate) {
          mae = Math.round(informe.mae * 100) / 100;
        } else {
          mae = Math.round(informe.mae * 10000) / 100;
        }
        fila['mae'] = mae;

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
          let ccsRango = informe.tiposAnomalias[8][index] + informe.tiposAnomalias[9][index];
          if (isNaN(ccsRango)) {
            ccsRango = 0;
          }
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

  calculate() {
    const plantas = this.portfolioControlService.listaPlantas;
    const informes = this.portfolioControlService.listaInformes;

    // plantasPendientes = plantasPendientes.filter(
    //   (planta) =>
    //     planta.id !== 'IQYvqbIexG8vpowC0uef' &&
    //     planta.id !== 'RJmyakiUjSS9xhOHArxl' &&
    //     planta.id !== 'WWnA1tBqXB6UbbF8d1q4'
    // );

    plantas.forEach((planta, index) => {
      // if (index < 10) {
      const informesPlanta = informes.filter((informe) => informe.plantaId === planta.id);

      let calcular = true;
      informesPlanta.forEach((informe) => {
        if (!informe.hasOwnProperty('tiposAnomalias')) {
          calcular = true;
        }
      });

      if (calcular) {
        // let rangos;

        // const criterioId = criteriosId[index];

        // rangos = criterios.find((criterio) => criterio.id === criterioId).rangosDT;

        let criterio: CritCriticidad;

        console.log('PlantaId: ' + planta.id + ' - ' + planta.nombre);
        this.anomaliaService
          .getCriterioId(planta)
          .pipe(
            take(1),
            switchMap((criterioId) => this.plantaService.getCriterioCriticidad(criterioId)),
            take(1),
            switchMap((crit) => {
              criterio = crit;
              this.anomaliaService.criterioCriticidad = crit;
              return this.anomaliaService.getAnomaliasPlanta$(planta.id, informesPlanta);
            })
          )
          .pipe(take(1))
          .subscribe((anoms) => {
            const anomalias = anoms.filter((anom) => anom.criticidad !== null);

            this.reportControlService.setTiposAnomaliaInformesPlanta(anomalias, informesPlanta, criterio.rangosDT);

            this.reportControlService.setNumAnomsByCoA(anomalias, informesPlanta);

            this.reportControlService.setNumAnomsByCriticidad(anomalias, informesPlanta, criterio);
          });
      }
      // }
    });
  }
}
