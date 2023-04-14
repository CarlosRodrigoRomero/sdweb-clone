import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
export class ChartTypesLossesReportComponent implements OnInit {
  public chartLoaded = false;
  private lastReport: InformeInterface;
  public chartOptionsCommon: Partial<ChartOptions>;
  public chartOptionsTypes: Partial<ChartOptions>;
  public chartOptionsLosses: Partial<ChartOptions>;
  public labelsCategoria: string[] = [];
  public coloresCategoria: string[] = [];
  public numsCategoria: number[] = [];
  public dataPlot: DataPlot[];

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService, private themeService: ThemeService) {}

  ngOnInit(): void {
    this.lastReport = this.reportControlService.informes[this.reportControlService.informes.length - 1];

    const anomaliasLastReport = this.reportControlService.allAnomalias.filter(
      (anom) => anom.informeId === this.lastReport.id
    );

    this.dataPlot = [];
    this.getAllCategorias(anomaliasLastReport);

    this.dataPlot.push(this.calculateDataPlot(anomaliasLastReport));

    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => this.initChart(theme.split('-')[0]));

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptionsCommon && this.chartOptionsTypes && this.chartOptionsLosses) {
          this.chartOptionsCommon = {
            ...this.chartOptionsCommon,
            tooltip: {
              theme: theme.split('-')[0],
            },
            dataLabels: {
              ...this.chartOptionsCommon.dataLabels,
              style: {
                ...this.chartOptionsCommon.dataLabels.style,
                colors: [this.themeService.textColor],
              },
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
          fontSize: '14px',
          colors: [this.themeService.textColor],
        },
        offsetX: 0,
        offsetY: -25,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      toolbar: {
        show: false,
      },
      legend: {
        show: false,
      },
      plotOptions: {
        bar: {
          barHeight: '100%',
          columnWidth: '45%',
          distributed: true,
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: {
        categories: ['Actual', 'Próximo año'],
        type: 'category',
        labels: {
          // rotate: 0,
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
        colors: this.coloresCategoria,
        title: {
          text: '# Anomalías por tipo',
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
      };

      const seriesMaeCat: ApexAxisChartSeries = [];
      this.dataPlot.forEach((data) => seriesMaeCat.push({ name: 'MAE Anomalías', data: data.perdidasPorCategoria }));

      this.chartOptionsLosses = {
        series: seriesMaeCat,
        title: {
          text: 'Pérdidas por tipo de anomalía',
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
        colors: [COLOR.gris],
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
      };

      this.chartLoaded = true;
    }
  }

  private getAllCategorias(anomalias: Anomalia[]): void {
    const allNumCategorias = GLOBAL.sortedAnomsTipos;

    const labelsCategoria = Array<string>();
    const coloresCategoria = Array<string>();
    const numsCategoria = Array<number>();

    allNumCategorias.forEach((i) => {
      if (anomalias.filter((anom) => anom.tipo === i).length > 0) {
        labelsCategoria.push(GLOBAL.labels_tipos[i]);
        coloresCategoria.push(Colors.rgbaToHex(COLOR.colores_tipos[i]));
        numsCategoria.push(i);
      }
    });
    this.labelsCategoria = labelsCategoria;
    this.coloresCategoria = coloresCategoria;
    this.numsCategoria = numsCategoria;
  }

  private calculateDataPlot(anomalias): DataPlot {
    let filtroCategoria: Anomalia[];
    let perdidasCategoria: number;

    const numPorCategoria = Array();
    const perdidasPorCategoria = Array();

    this.numsCategoria.forEach((i) => {
      filtroCategoria = anomalias.filter((anom) => anom.tipo === i);
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
      coloresCategoria: this.coloresCategoria,
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
}
