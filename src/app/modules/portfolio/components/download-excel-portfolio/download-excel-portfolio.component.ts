import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { switchMap, take } from 'rxjs/operators';

import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { ExcelService } from '@data/services/excel.service';
import { GLOBAL } from '@data/constants/global';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PlantaService } from '@data/services/planta.service';
import { WarningService } from '@data/services/warning.service';

import { ReportControlService } from '@data/services/report-control.service';
import { CritCriticidad } from '@core/models/critCriticidad';
import { LocationAreaInterface } from '@core/models/location';

@Component({
  selector: 'app-download-excel-portfolio',
  templateUrl: './download-excel-portfolio.component.html',
  styleUrls: ['./download-excel-portfolio.component.css'],
  providers: [DatePipe],
})
export class DownloadExcelPortfolioComponent implements OnInit {
  userDemo = false;
  private columnas = {
    general: ['Nombre planta', 'Fecha inspección', 'Potencia (MW)', 'Tipo', 'MAE (%)', 'Nº total anomalías'],
    coa: ['CoA 1', 'CoA 2', 'CoA 3'],
    criticidad: [],
    tipos: [],
    ccs: ['Células calientes (%)', 'Nº total céls. calientes'],
  };
  private tiposAnomsNoUtilizados: number[] = GLOBAL.tipos_no_utilizados;
  private headersColors = {
    general: 'FFE5E7E9',
    coa: 'fff9cb9c',
    criticidad: 'ffd9d2e9',
    tipos: 'FFB8CCE4',
    ccs: 'FFF5B7B1',
  };
  private filas: any[] = [];
  private sheetName = 'Portfolio';
  private excelFileName = 'Portfolio';

  constructor(
    private portfolioControlService: PortfolioControlService,
    private excelService: ExcelService,
    private datePipe: DatePipe,
    private anomaliaService: AnomaliaService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private warningService: WarningService
  ) {}

  ngOnInit(): void {
    if (this.portfolioControlService.user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2') {
      this.userDemo = true;
    }

    this.portfolioControlService.criterioCriticidad.labels.forEach((label, index) => {
      this.columnas.criticidad.push('Criticidad ' + label);
    });

    this.portfolioControlService.criterioCriticidad.rangosDT.forEach((rango, index, rangos) => {
      let columna: string;
      if (index < rangos.length - 1) {
        columna = 'Cels. calientes por ΔT Max (norm) ' + rango + ' - ' + rangos[index + 1] + 'ºC';
      } else {
        columna = 'Cels. calientes por ΔT Max (norm) >' + rango + 'ºC';
      }

      this.columnas.ccs.push(columna);
    });

    GLOBAL.sortedAnomsTipos.forEach((tipo) => {
      const labels = GLOBAL.labels_tipos;

      if (!this.tiposAnomsNoUtilizados.includes(tipo) && tipo !== 8 && tipo !== 9) {
        this.columnas.tipos.push(labels[tipo]);
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

        /* ANOMALIAS POR CLASE */
        if (informe.hasOwnProperty('numsCoA')) {
          informe.numsCoA.forEach((coa, index) => (fila[`coa${index + 1}`] = coa));
        } else {
          fila['coa1'] = 0;
          fila['coa2'] = 0;
          fila['coa3'] = 0;
        }

        /* ANOMALIAS POR CRITICIDAD */
        if (informe.hasOwnProperty('numsCriticidad')) {
          this.portfolioControlService.criterioCriticidad.labels.forEach(
            (_, index) => (fila[`criticidad${index + 1}`] = informe.numsCriticidad[index])
          );
        } else {
          this.portfolioControlService.criterioCriticidad.labels.forEach(
            (_, index) => (fila[`criticidad${index + 1}`] = 0)
          );
        }

        /* ANOMALIAS POR TIPO */
        GLOBAL.sortedAnomsTipos.forEach((tipo) => {
          if (!this.tiposAnomsNoUtilizados.includes(tipo) && tipo !== 8 && tipo !== 9) {
            fila['tipo' + tipo] = informe.tiposAnomalias[tipo];
          }
        });

        /* CELULAS CALIENTES */
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

        this.filas.push(fila);

        if (this.filas.length === informes.length) {
          this.downloadExcel();
        }
      });
    });
  }

  private downloadExcel() {
    this.excelService.exportAsExcelFile(
      Object.values(this.columnas),
      Object.values(this.headersColors),
      this.filas,
      this.excelFileName,
      this.sheetName,
      undefined
    );
  }

  calculate() {
    const plantas = this.portfolioControlService.listaPlantas;
    const informes = this.portfolioControlService.listaInformes;

    plantas.forEach((planta, index) => {
      // if (index < 20) {
      const informesPlanta = informes.filter((informe) => informe.plantaId === planta.id);

      if (informesPlanta.length > 0) {
        let locationAreas: LocationAreaInterface[] = [];
        let criterio: CritCriticidad;

        this.plantaService
          .getLocationsArea(planta.id)
          .pipe(
            take(1),
            switchMap((locAreas) => {
              locationAreas = locAreas;

              return this.anomaliaService.getCriterioId(planta);
            }),
            take(1),
            switchMap((criterioId) => this.plantaService.getCriterioCriticidad(criterioId)),
            take(1),
            switchMap((crit) => {
              criterio = crit;
              return this.anomaliaService.getAnomaliasPlanta$(planta, informesPlanta, criterio);
            }),
            take(1)
          )
          .subscribe((anoms) => {
            informesPlanta.forEach((informe) => {
              let anomaliasInforme = anoms.filter((anom) => anom.informeId === informe.id);

              // descartamos las anomalias que no lo son para el cliente
              anomaliasInforme = this.anomaliaService.getRealAnomalias(anomaliasInforme);

              this.warningService
                .getWarnings(informe.id)
                .pipe(take(1))
                .subscribe((warnings) => {
                  if (warnings.length === 0) {
                    this.warningService.checkWarnings(informe, anomaliasInforme, warnings, planta, locationAreas);
                  }
                });

              // this.reportControlService.setTiposAnomInforme(anomaliasInforme, informe, true, criterio);

              // this.reportControlService.setNumAnomsCoAInforme(anomaliasInforme, informe, true);

              // this.reportControlService.setNumAnomsCritInforme(anomaliasInforme, informe, true, criterio);
            });
          });
        // }
      }
    });
  }
}
