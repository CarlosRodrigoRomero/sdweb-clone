import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
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
} from 'ng-apexcharts';

import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';
import { ThemeService } from '@data/services/theme.service';

import { Anomalia } from '@core/models/anomalia';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

import { Colors } from '@core/classes/colors';

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
  selector: 'app-chart-tipo-anoms',
  templateUrl: './chart-tipo-anoms.component.html',
  styleUrls: ['./chart-tipo-anoms.component.css'],
})
export class ChartTipoAnomsComponent implements OnInit, OnDestroy {
  @ViewChild('chartTipoAnoms') chartTipoAnoms: ChartComponent;
  public chartOptionsComun: Partial<ChartOptions>;
  public chartOptions1: Partial<ChartOptions>;
  public chartOptions2: Partial<ChartOptions>;
  public selectedAnomalias: Anomalia[];

  public labelsCategoria: string[] = [];
  public coloresCategoria: string[] = [];
  public numsCategoria: number[] = [];

  public chartLoaded = false;
  public selectedInformeId: string;
  public informesIdList: string[];
  public dataPlot: DataPlot[];
  public allAnomalias: Anomalia[] = [];
  public chartHeight = 300;

  private labelDatesReports: string;
  private anomaliasLabel: string;
  private maeLabel: string;
  private maeAnomsLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.informesIdList = this.reportControlService.informesIdList;

    this.allAnomalias = this.reportControlService.allAnomalias;

    this.dataPlot = [];
    this.getAllCategorias(this.allAnomalias);

    this.informesIdList.forEach((informeId) => {
      const anomaliasInforme = this.allAnomalias.filter((item) => item.informeId === informeId);
      this.dataPlot.push(this.calculateDataPlot(anomaliasInforme, informeId));
    });

    this.informeService
      .getDateLabelsInformes(this.informesIdList)
      .pipe(
        take(1),
        switchMap((labels) => {
          this.labelDatesReports = labels.join(' - ');

          return this.themeService.themeSelected$;
        }),
        take(1)
      )
      .subscribe((theme) => this.initChart(theme.split('-')[0]));

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptionsComun && this.chartOptions1 && this.chartOptions2) {
          this.chartOptionsComun = {
            ...this.chartOptionsComun,
            tooltip: {
              theme: theme.split('-')[0],
            },
            dataLabels: {
              ...this.chartOptionsComun.dataLabels,
              style: {
                ...this.chartOptionsComun.dataLabels.style,
                colors: [this.themeService.textColor],
              },
            },
          };

          this.chartOptions1 = {
            ...this.chartOptions1,
            chart: {
              ...this.chartOptions1.chart,
              foreColor: this.themeService.textColor,
            },
          };

          this.chartOptions2 = {
            ...this.chartOptions2,
            chart: {
              ...this.chartOptions2.chart,
              foreColor: this.themeService.textColor,
            },
          };
        }
      })
    );

    this.checkTranslate();
  }

  private getAllCategorias(anomalias: Anomalia[]): void {
    const allNumCategorias = GLOBAL.sortedAnomsTipos;

    const labelsCategoria = Array<string>();
    const coloresCategoria = Array<string>();
    const numsCategoria = Array<number>();

    allNumCategorias.forEach((i) => {
      if (anomalias.filter((anom) => anom.tipo === i).length > 0) {
        this.translate
          .get(GLOBAL.labels_tipos[i])
          .pipe(take(1))
          .subscribe((res: string) => {
            labelsCategoria.push(res);
            coloresCategoria.push(Colors.rgbaToHex(COLOR.colores_tipos[i]));
            numsCategoria.push(i);
          });
      }
    });
    this.labelsCategoria = labelsCategoria;
    this.coloresCategoria = coloresCategoria;
    this.numsCategoria = numsCategoria;
  }

  private calculateDataPlot(anomalias, informeId: string): DataPlot {
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
      informeId,
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

  initChart(theme: string) {
    this.chartOptionsComun = {
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
          // endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: {
        categories: this.labelsCategoria,
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
      this.dataPlot.forEach((data) =>
        seriesNumCat.push({ name: '# ' + this.anomaliasLabel, data: data.numPorCategoria })
      );

      this.chartOptions1 = {
        series: seriesNumCat,
        colors: this.coloresCategoria,
        title: {
          text: '# ' + this.anomaliasLabel + ' (' + this.labelDatesReports + ')',
          align: 'left',
        },
        chart: {
          id: 'fb',
          group: 'social',
          type: 'bar',
          width: '100%',
          height: this.chartHeight,
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
      this.dataPlot.forEach((data) => seriesMaeCat.push({ name: this.maeAnomsLabel, data: data.perdidasPorCategoria }));

      this.chartOptions2 = {
        series: seriesMaeCat,
        title: {
          text: this.maeLabel + ' (' + this.labelDatesReports + ')',
          align: 'left',
        },
        chart: {
          id: 'tw',
          group: 'social',
          type: 'bar',
          width: '100%',
          height: this.chartHeight,
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

  private checkTranslate(): void {
    this.translate
      .get('MAE')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeLabel = res;
      });

    this.translate
      .get('MAE Anomalías')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeAnomsLabel = res;
      });

    this.translate
      .get('Anomalías')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.anomaliasLabel = res;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
