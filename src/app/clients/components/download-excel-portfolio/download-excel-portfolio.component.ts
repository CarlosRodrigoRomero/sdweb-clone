import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { ExcelService } from '@core/services/excel.service';
import { GLOBAL } from '@core/services/global';
import { AnomaliaService } from '@core/services/anomalia.service';
import { AdminService } from '@core/services/admin.service';

import { CritCriticidad } from '@core/models/critCriticidad';

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
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    if (this.portfolioControlService.user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2') {
      this.userDemo = true;
    }
  }

  getPortfolioData() {
    const plantas = this.portfolioControlService.listaPlantas;
    const informes = this.portfolioControlService.listaInformes;

    plantas.forEach((planta) => {
      let criterioCriticidad: CritCriticidad;

      // primero comprovamos si la planta tiene criterio
      let criterioId: string;
      if (planta.hasOwnProperty('criterioId')) {
        criterioId = planta.criterioId;
      }

      // this.adminService.getUser(planta.empresa).pipe(
      //   take(1),
      //   switchMap((user) => {
      //     // comprobamos primero que exista el usuario
      //     if (user !== undefined && user !== null) {
      //       // si la planta no tiene criterio, comprobamos si lo tiene el user
      //       if (criterioId === undefined || criterioId === null) {
      //         if (user.hasOwnProperty('criterioId')) {
      //           criterioId = user.criterioId;
      //         }
      //       }
      //     } else {
      //       // aviso para que se cree el usuario que falta
      //       console.log('Falta usuario en la DB');
      //     }

      //     if (criterioId === undefined || criterioId === null) {
      //       // si el cliente no tiene criterio propio asignamos el criterio por defecto Solardrone5
      //       criterioId = 'aU2iM5nM0S3vMZxMZGff';
      //     }
      //   })
      // );

      const informesPlanta = informes.filter((informe) => informe.plantaId === planta.id);

      informesPlanta.forEach((informe) => {
        let tipo = 'anomalias';
        if (planta.tipo === 'seguidores') {
          tipo = 'pcs';
        }
        this.anomaliaService
          .getRawAnomaliasInfome$(informe.id, tipo)
          .pipe(take(1))
          .subscribe((anomaliasInforme) => {
            // tslint:disable-next-line: triple-equals
            const ccTotales = anomaliasInforme.filter((anom) => anom.tipo == 8 || anom.tipo == 9);

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
  }

  private downloadExcel() {
    this.excelService.exportAsExcelFile(this.columnas, this.filas, this.excelFileName, this.sheetName, 0);
  }
}
