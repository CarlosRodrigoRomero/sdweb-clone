import { Component, OnDestroy, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend,
  ApexAnnotations,
  ApexTooltip,
  ApexPlotOptions,
  ApexFill,
} from 'ng-apexcharts';

import { ReportControlService } from '@data/services/report-control.service';
import { ThemeService } from '@data/services/theme.service';

import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';
import { GLOBAL } from '@data/constants/global';
import { Colors } from '@core/classes/colors';
import { COLOR } from '@data/constants/color';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  fill: ApexFill;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
  annotations: ApexAnnotations;
  toolbar: any;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
};

export interface DataPlot {
  anomalias: Anomalia[];
  informeId: string;
  numPorCategoria: number[];
  perdidasPorCategoria: number[];
  labelsCategoria: string[];
  coloresCategoria: string[];
}

@Component({
  selector: 'app-chart-types-losses-report',
  templateUrl: './chart-types-losses-report.component.html',
  styleUrls: ['./chart-types-losses-report.component.css'],
})
export class ChartTypesLossesReportComponent implements OnInit, OnDestroy {
  public chartLoaded = false;
  private lastReport: InformeInterface;
  public chartOptionsCommon: Partial<ChartOptions>;
  public chartOptionsTypes: Partial<ChartOptions>;
  public chartOptionsLosses: Partial<ChartOptions>;
  public labelsCategoria: string[] = [];
  public coloresFillCategoria: string[] = [];
  public coloresStrokeCategoria: string[] = [];
  public numsCategoria: number[] = [];
  public dataPlot: DataPlot[];

  private anomsTipoLabel: string;
  private maeTipoLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkTranslate();

    this.lastReport = this.reportControlService.informes[this.reportControlService.informes.length - 1];

    const anomaliasLastReport = this.reportControlService.allAnomalias.filter(
      (anom) => anom.informeId === this.lastReport.id
    );

    this.dataPlot = [];
    this.getAllCategorias(anomaliasLastReport);

    this.dataPlot.push(this.calculateFakeDataPlot(anomaliasLastReport));
    this.dataPlot.push(this.calculateFakeDataPlot(anomaliasLastReport, true));

    // this.dataPlot.push(this.calculateDataPlot(anomaliasLastReport));
    // this.dataPlot.push(this.calculateDataPlot(anomaliasLastReport, true));

    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => this.initChart(theme.split('-')[0]));

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptionsCommon && this.chartOptionsTypes && this.chartOptionsLosses) {
          let colorStroke = COLOR.dark_orange;
          if (theme === 'dark-theme') {
            colorStroke = COLOR.dark_orange;
          } else {
            colorStroke = COLOR.light_orange;
          }

          this.chartOptionsCommon = {
            ...this.chartOptionsCommon,
            tooltip: {
              theme: theme.split('-')[0],
            },
          };

          this.chartOptionsTypes = {
            ...this.chartOptionsTypes,
            chart: {
              ...this.chartOptionsTypes.chart,
              foreColor: this.themeService.textColor,
            },
          };

          this.chartOptionsLosses = {
            ...this.chartOptionsLosses,
            chart: {
              ...this.chartOptionsLosses.chart,
              foreColor: this.themeService.textColor,
            },
            stroke: {
              ...this.chartOptionsLosses.stroke,
              colors: [colorStroke],
            },
          };
        }
      })
    );
  }

  initChart(theme: string) {
    this.chartOptionsCommon = {
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          colors: [this.themeService.textColor],
        },
        offsetX: 0,
        offsetY: -25,
      },
      // fill: {
      //   colors: this.coloresFillCategoria,
      // },
      toolbar: {
        show: false,
      },
      legend: {
        show: false,
      },
      plotOptions: {
        bar: {
          barHeight: '100%',
          columnWidth: '60%',
          distributed: true,
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: {
        categories: this.labelsCategoria,
        type: 'category',
        labels: {
          style: {
            fontSize: '10px',
          },
        },
      },
      tooltip: {
        followCursor: false,
        x: {
          show: false,
        },
        marker: {
          show: false,
        },
        y: {
          title: {
            formatter: (s) => {
              return s;
            },
          },
        },
        theme,
      },
    };

    // espera a que el dataPlot tenga datos
    if (this.dataPlot[0] !== undefined) {
      const seriesNumCat: ApexAxisChartSeries = [];
      this.dataPlot.forEach((data) => seriesNumCat.push({ name: '# Anomalías', data: data.numPorCategoria }));

      this.chartOptionsTypes = {
        series: seriesNumCat,
        colors: [COLOR.dark_neutral],
        title: {
          text: '# ' + this.anomsTipoLabel,
          align: 'left',
        },
        chart: {
          id: 'fb',
          group: 'social',
          type: 'bar',
          width: '100%',
          height: 300,
          foreColor: this.themeService.textColor,
          toolbar: {
            show: false,
          },
        },
        yaxis: {
          max: (v) => {
            return Math.round(1.1 * v);
          },
          tickAmount: 3,
          labels: {
            minWidth: 10,
          },
        },
        stroke: {
          show: true,
          width: 2,
          dashArray: [0, 6],
          colors: this.coloresStrokeCategoria,
        },
      };

      const seriesMaeCat: ApexAxisChartSeries = [];
      this.dataPlot.forEach((data) => seriesMaeCat.push({ name: 'MAE Anomalías', data: data.perdidasPorCategoria }));

      this.chartOptionsLosses = {
        series: seriesMaeCat,
        title: {
          text: this.maeTipoLabel,
          align: 'left',
        },
        chart: {
          id: 'tw',
          group: 'social',
          type: 'bar',
          width: '100%',
          height: 300,
          foreColor: this.themeService.textColor,
          toolbar: {
            show: false,
          },
        },
        colors: [COLOR.dark_neutral],
        yaxis: {
          max: (v) => {
            return Math.round(1.1 * v);
          },
          forceNiceScale: true,
          tickAmount: 3,
          labels: {
            minWidth: 10,
            formatter: (value) => {
              return Math.round(value).toString();
            },
          },
        },
        stroke: {
          show: true,
          width: 2,
          dashArray: [0, 10],
          colors: [COLOR.dark_orange],
        },
      };

      this.chartLoaded = true;
    }
  }

  private getAllCategorias(anomalias: Anomalia[]): void {
    const allNumCategorias = GLOBAL.sortedAnomsTipos;

    const labelsCategoria = Array<string>();
    const coloresFillCategoria = Array<string>();
    const coloresStrokeCategoria = Array<string>();
    const numsCategoria = Array<number>();

    allNumCategorias.forEach((i) => {
      if (anomalias.filter((anom) => anom.tipo === i).length > 0) {
        this.translate
          .get(GLOBAL.labels_tipos[i])
          .pipe(take(1))
          .subscribe((res: string) => {
            labelsCategoria.push(res);
            coloresFillCategoria.push('transparent');
            coloresStrokeCategoria.push(Colors.rgbaToHex(COLOR.colores_tipos[i]));
            numsCategoria.push(i);
          });
      } else if (
        anomalias[0].hasOwnProperty('tipoNextYear') &&
        anomalias.filter((anom) => anom.tipoNextYear === i).length > 0
      ) {
        this.translate
          .get(GLOBAL.labels_tipos[i])
          .pipe(take(1))
          .subscribe((res: string) => {
            labelsCategoria.push(res);
            coloresFillCategoria.push('transparent');
            coloresStrokeCategoria.push(Colors.rgbaToHex(COLOR.colores_tipos[i]));
            numsCategoria.push(i);
          });
      }
    });
    this.labelsCategoria = labelsCategoria;
    this.coloresFillCategoria = coloresFillCategoria;
    this.coloresStrokeCategoria = coloresStrokeCategoria;
    this.numsCategoria = numsCategoria;
  }

  private calculateFakeDataPlot(anomalias: Anomalia[], prediction = false): DataPlot {
    let numPorCategoria = Array();
    let perdidasPorCategoria = Array();

    const tipos = [18, 17, 10, 3, 7, 14, 15];

    if (prediction) {
      numPorCategoria = [1399, 150, 2, 69, 1, 8, 37];
      numPorCategoria.forEach((num, index) => {
        perdidasPorCategoria.push(num * GLOBAL.pcPerdidas[tipos[index]]);
      });
    } else {
      numPorCategoria = [1339, 140, 2, 62, 1, 6, 37];
      numPorCategoria.forEach((num, index) => {
        perdidasPorCategoria.push(num * GLOBAL.pcPerdidas[tipos[index]]);
      });
    }

    return {
      anomalias,
      informeId: this.lastReport.id,
      numPorCategoria,
      perdidasPorCategoria,
      labelsCategoria: this.labelsCategoria,
      coloresCategoria: this.coloresFillCategoria,
    };
  }

  private calculateDataPlot(anomalias: Anomalia[], prediction = false): DataPlot {
    let filtroCategoria: Anomalia[];
    let perdidasCategoria: number;

    const numPorCategoria = Array();
    const perdidasPorCategoria = Array();

    this.numsCategoria.forEach((i) => {
      if (prediction) {
        filtroCategoria = anomalias.filter((anom) => anom.tipoNextYear === i);
      } else {
        filtroCategoria = anomalias.filter((anom) => anom.tipo === i);
      }

      if (filtroCategoria.length > 0) {
        perdidasCategoria = this._getMAEAnomalias(filtroCategoria);

        perdidasPorCategoria.push(Math.round(perdidasCategoria * 10) / 10);
        numPorCategoria.push(filtroCategoria.length);
      } else {
        numPorCategoria.push(0);
        perdidasPorCategoria.push(0);
      }
    });
    return {
      anomalias,
      informeId: this.lastReport.id,
      numPorCategoria,
      perdidasPorCategoria,
      labelsCategoria: this.labelsCategoria,
      coloresCategoria: this.coloresFillCategoria,
    };
  }

  private _getMAEAnomalias(anomalias: Anomalia[]): number {
    return anomalias
      .map((anom) => {
        let numeroModulos: number;
        if (anom.hasOwnProperty('modulosAfectados')) {
          if (isNaN(anom.modulosAfectados)) {
            numeroModulos = 1;
          } else {
            numeroModulos = anom.modulosAfectados;
          }
        } else {
          numeroModulos = 1;
        }

        return GLOBAL.pcPerdidas[anom.tipo] * numeroModulos;
      })
      .reduce((a, b) => a + b, 0);
  }

  private checkTranslate(): void {
    this.translate
      .get('Anomalías por tipo')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.anomsTipoLabel = res;
      });

    this.translate
      .get('MAE por tipo de anomalía')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeTipoLabel = res;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
