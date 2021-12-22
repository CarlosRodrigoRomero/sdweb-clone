import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { switchMap, take } from 'rxjs/operators';

import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { ExcelService } from '@core/services/excel.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PlantaService } from '@core/services/planta.service';
import { GLOBAL } from '@core/services/global';
import { ReportControlService } from '@core/services/report-control.service';
import { CritCriticidad } from '@core/models/critCriticidad';

@Component({
  selector: 'app-download-excel-portfolio',
  templateUrl: './download-excel-portfolio.component.html',
  styleUrls: ['./download-excel-portfolio.component.css'],
  providers: [DatePipe, DecimalPipe],
})
export class DownloadExcelPortfolioComponent implements OnInit {
  userDemo = false;
  private columnas: string[][] = [
    ['Nombre planta', 'Fecha inspección', 'Potencia (MW)', 'Tipo', 'MAE (%)', 'Nº total anomalías'],
    ['Células calientes (%)', 'Nº total céls. calientes'],
    [],
  ];
  private headersColors = ['FFE5E7E9', 'FFF5B7B1', 'FFD4EFDF'];
  private filas: any[] = [];
  private sheetName = 'Portfolio';
  private excelFileName = 'Portfolio';
  private columnasFormula = [6, 8];
  private formulas: string[] = [];

  constructor(
    private portfolioControlService: PortfolioControlService,
    private excelService: ExcelService,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe,
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

    // formula suma todas las anomalias
    this.formulas.push(
      `SUM(I#:${this.excelService.numToAlpha(
        7 + this.portfolioControlService.criterioCriticidad.rangosDT.length + GLOBAL.labels_tipos.length - 3
      )}#)`
    );
    // formula suma de ccs
    this.formulas.push(
      `SUM(I#:${this.excelService.numToAlpha(7 + this.portfolioControlService.criterioCriticidad.rangosDT.length)}#)`
    );
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

        fila['numAnomalias'] = '';

        fila['cc'] = Math.round(informe.cc * 10000) / 100;

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
      undefined,
      this.columnasFormula,
      this.formulas
    );
  }

  calculate() {
    const plantas = this.portfolioControlService.listaPlantas;
    const informes = this.portfolioControlService.listaInformes;

    console.log(informes.filter((informe) => !informe.hasOwnProperty('tiposAnomalias')).length);

    const criteriosId = [
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'wRubKS2StaZTrc0644lJ',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'aU2iM5nM0S3vMZxMZGff',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'aU2iM5nM0S3vMZxMZGff',
      'ZHSp2yNdpORe3XMDAxoA',
      'ZHSp2yNdpORe3XMDAxoA',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'ZHSp2yNdpORe3XMDAxoA',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'ZHSp2yNdpORe3XMDAxoA',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'BuAdwZlgE8doyc558oAM',
      'aU2iM5nM0S3vMZxMZGff',
      'cgrOwQnVxWgftFeQICJc',
      'xuAMPmcDLQAaoVHX1bpi',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'aU2iM5nM0S3vMZxMZGff',
      'wRubKS2StaZTrc0644lJ',
      'nByXBdGjlf7ifhVKu6pc',
      'aU2iM5nM0S3vMZxMZGff',
    ];

    const criterios: CritCriticidad[] = [
      {
        id: 'BuAdwZlgE8doyc558oAM',
        criterioConstante: [null, null, [3, 4, 5, 6, 7, 10, 12, 14, 17]],
        labels: ['Leve', 'Media', 'Grave'],
        nombre: 'Eolia',
        siempreVisible: [15, 18],
        rangosDT: [5, 10, 40],
      },
      {
        id: 'ZHSp2yNdpORe3XMDAxoA',
        criterioConstante: [null, [3, 6, 10, 12], [4, 5, 7, 17, 14]],
        labels: ['Leve', 'Media', 'Grave'],
        nombre: 'Solardrone10',
        siempreVisible: [15, 18],
        rangosDT: [10, 10, 40],
      },
      {
        id: 'aU2iM5nM0S3vMZxMZGff',
        criterioConstante: [null, null, [3, 4, 5, 6, 7, 10, 12, 14, 17]],
        labels: ['Leve', 'Media', 'Grave'],
        nombre: 'Eolia',
        siempreVisible: [15, 18],
        rangosDT: [5, 10, 40],
      },
      {
        id: 'cgrOwQnVxWgftFeQICJc',
        criterioConstante: [null, null, [3, 4, 5, 6, 7, 10, 12, 14, 17]],
        labels: ['Leve', 'Media', 'Grave'],
        nombre: 'Eolia',
        siempreVisible: [15, 18],
        rangosDT: [5, 10, 20],
      },
      {
        id: 'nByXBdGjlf7ifhVKu6pc',
        criterioConstante: [null, null, [3, 4, 5, 6, 7, 10, 12, 14, 17]],
        labels: ['Leve', 'Media', 'Grave'],
        nombre: 'Eolia',
        siempreVisible: [15, 18],
        rangosDT: [5, 10, 40],
      },
      {
        id: 'wRubKS2StaZTrc0644lJ',
        criterioConstante: [null, null, [3, 4, 5, 6, 7, 10, 12, 14, 17]],
        labels: ['Leve', 'Media', 'Grave'],
        nombre: 'Eolia',
        siempreVisible: [15, 18],
        rangosDT: [5, 10, 20, 30, 100],
      },
      {
        id: 'xuAMPmcDLQAaoVHX1bpi',
        criterioConstante: [null, null, [3, 4, 5, 6, 7, 10, 12, 14, 17]],
        labels: ['Leve', 'Media', 'Grave'],
        nombre: 'Eolia',
        siempreVisible: [15, 18],
        rangosDT: [5, 10, 40],
      },
    ];

    plantas.forEach((planta, index) => {
      // if (index < 5) {
      const informesPlanta = informes.filter((informe) => informe.plantaId === planta.id);

      let calcular = false;
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
            console.log(planta.id);
            const anomalias = anoms.filter((anom) => anom.criticidad !== null);

            this.reportControlService.setTiposAnomaliaInformesPlanta(anomalias, informesPlanta, criterio.rangosDT);
          });

        // this.anomaliaService
        //   .getAnomaliasPlanta$(planta.id)
        //   .pipe(take(1))
        //   .subscribe((anoms) => {
        //     console.log(anoms);

        //     const anomalias = anoms.filter((anom) => anom.criticidad !== null);

        //     console.log(anomalias.length);

        //     this.reportControlService.setTiposAnomaliaInformesPlanta(anomalias, informesPlanta, rangos);
        //   });
      }
      // }
    });
  }
}
