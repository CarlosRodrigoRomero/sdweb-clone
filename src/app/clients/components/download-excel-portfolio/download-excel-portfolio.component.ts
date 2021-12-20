import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { ExcelService } from '@core/services/excel.service';
import { GLOBAL } from '@core/services/global';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';

import { CritCriticidad } from '@core/models/critCriticidad';
import { forkJoin, Observable } from 'rxjs';
import { Anomalia } from '@core/models/anomalia';

interface Fila {
  nombre: string;
  potencia: number;
  mae: number;
  tipo: string;
  fechaInspeccion: string;
  ccTotales: number;
  ccMenos20: number;
  cc20a30: number;
  cc30a40: number;
  ccMas40: number;
}
@Component({
  selector: 'app-download-excel-portfolio',
  templateUrl: './download-excel-portfolio.component.html',
  styleUrls: ['./download-excel-portfolio.component.css'],
})
export class DownloadExcelPortfolioComponent implements OnInit {
  userDemo = false;
  private columnas = [
    'Nombre planta',
    'Potencia (MW)',
    'MAE (%)',
    'Tipo',
    'Fecha inspección',
    'Células calientes totales',
    'Cels. calientes <20ºC',
    'Cels. calientes 20 - 30ºC',
    'Cels. calientes 30 - 40ºC',
    'Cels. calientes >40ºC',
    '',
  ];
  private filas: Fila[] = [];
  private sheetName = 'Portfolio';
  private excelFileName = 'Informe';

  constructor(
    private portfolioControlService: PortfolioControlService,
    private excelService: ExcelService,
    private anomaliaService: AnomaliaService,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    if (this.portfolioControlService.user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2') {
      this.userDemo = true;
    }
  }

  getPortfolioData() {
    const plantas = this.portfolioControlService.listaPlantas;
    const informes = this.portfolioControlService.listaInformes;

    const criteriosObservables: Observable<CritCriticidad>[] = [];

    plantas.forEach((planta) => {
      /* criteriosObservables.push(
        this.anomaliaService.getCriterioId(planta).pipe(
          take(1),
          switchMap((criterioId) => {
            console.log(criterioId);

            return this.plantaService.getCriterioCriticidad(criterioId);
          })
        )
      ); */

      const informesPlanta = informes.filter((informe) => informe.plantaId === planta.id);

      const anomsInfsObservables: Observable<Anomalia[]>[] = [];

      informesPlanta.forEach((informe) => {
        let tipo = 'anomalias';
        if (planta.tipo === 'seguidores') {
          tipo = 'pcs';
        }

        anomsInfsObservables.push(this.anomaliaService.getRawAnomaliasInfome$(informe.id, tipo).pipe(take(1)));
      });

      forkJoin(anomsInfsObservables).subscribe((allAnoms) => {
        console.log(allAnoms);

        allAnoms.forEach((anomsInforme, index) => {
          const informe = informesPlanta[index];
          // tslint:disable-next-line: triple-equals
          const ccTotales = anomsInforme.filter((anom) => anom.tipo == 8 || anom.tipo == 9);

          const fila: Fila = {
            nombre: planta.nombre,
            potencia: planta.potencia,
            mae: informe.mae,
            tipo: planta.tipo,
            fechaInspeccion: informe.fecha.toString(),
            ccTotales: ccTotales.length,
            ccMenos20: ccTotales.filter((anom) => anom.temperaturaMax < 20).length,
            cc20a30: ccTotales.filter((anom) => anom.temperaturaMax >= 20 && anom.temperaturaMax < 30).length,
            cc30a40: ccTotales.filter((anom) => anom.temperaturaMax >= 30 && anom.temperaturaMax < 40).length,
            ccMas40: ccTotales.filter((anom) => anom.temperaturaMax >= 40).length,
          };

          this.filas.push(fila);

          if (this.filas.length === informes.length) {
            this.downloadExcel();
          }
        });
      });
    });

    // forkJoin(criteriosObservables).subscribe((allCriterios) => {
    //   allCriterios.forEach((criterio, index) => {
    //     if (criterio.labels !== undefined) {
    //       this.anomaliaService.criterioCriticidad = criterio;
    //     }
    //     const planta = plantas[index];
    //   });
    // });
  }

  private downloadExcel() {
    this.excelService.exportAsExcelFile(this.columnas, this.filas, this.excelFileName, this.sheetName, 0);
  }
}
