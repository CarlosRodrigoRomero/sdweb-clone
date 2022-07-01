import { Component, OnInit, ViewChild } from '@angular/core';

import { take } from 'rxjs/operators';

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
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';

import { Anomalia } from '@core/models/anomalia';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

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
export class ChartTipoAnomsComponent implements OnInit {
  @ViewChild('chartTipoAnoms') chartTipoAnoms: ChartComponent;
  public chartOptionsComun: Partial<ChartOptions>;
  public chartOptions1: Partial<ChartOptions>;
  public chartOptions2: Partial<ChartOptions>;
  public selectedAnomalias: Anomalia[];

  public labelsCategoria: string[];
  public coloresCategoria: string[];
  public numsCategoria: number[];

  public chartLoaded = false;
  public selectedInformeId: string;
  public informesIdList: string[];
  public dataPlot: DataPlot[];
  public allAnomalias: Anomalia[] = [];
  public chartHeight = 300;

  private labelDatesReports: string;

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private anomaliaInfoService: AnomaliaInfoService
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
      .pipe(take(1))
      .subscribe((labels) => {
        this.labelDatesReports = labels.join(' - ');

        this.initChart();
      });
  }

  private getAllCategorias(anomalias): void {
    const allNumCategorias = GLOBAL.sortedAnomsTipos;

    const labelsCategoria = Array<string>();
    const coloresCategoria = Array<string>();
    const numsCategoria = Array<number>();

    allNumCategorias.forEach((i) => {
      if (anomalias.filter((anom) => anom.tipo === i).length > 0) {
        labelsCategoria.push(GLOBAL.labels_tipos[i]);
        coloresCategoria.push(this.anomaliaInfoService.getPerdidasColor(GLOBAL.pcPerdidas[i]));
        numsCategoria.push(i);
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

  initChart() {
    this.chartOptionsComun = {
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '14px',
          colors: ['#304758'],
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
        tools: {
          selection: false,
        },
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
      },
      // grid: {
      //   clipMarkers: false,
      // },
    };

    // espera a que el dataPlot tenga datos
    if (this.dataPlot[0] !== undefined) {
      const seriesNumCat: ApexAxisChartSeries = [];
      this.dataPlot.forEach((data) => seriesNumCat.push({ name: '# Anomalías', data: data.numPorCategoria }));

      this.chartOptions1 = {
        series: seriesNumCat,
        colors: this.coloresCategoria,
        title: {
          text: '# Anomalías     (' + this.labelDatesReports + ')',
          align: 'left',
        },

        chart: {
          id: 'fb',
          group: 'social',
          type: 'bar',
          width: '100%',
          height: this.chartHeight,
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

      this.chartOptions2 = {
        series: seriesMaeCat,
        title: {
          text: 'MAE     (' + this.labelDatesReports + ')',
          align: 'left',
        },
        chart: {
          id: 'tw',
          group: 'social',
          type: 'bar',
          width: '100%',
          height: this.chartHeight,
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
}
