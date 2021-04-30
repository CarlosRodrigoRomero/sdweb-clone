import { Component, OnInit, ViewChild } from '@angular/core';

import { combineLatest } from 'rxjs';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { ReportControlService } from '@core/services/report-control.service';

import { Anomalia } from '@core/models/anomalia';

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
  selector: 'app-chart-numsyperd',
  templateUrl: './chart-numsyperd.component.html',
  styleUrls: ['./chart-numsyperd.component.css'],
})
export class ChartNumsyperdComponent implements OnInit {
  @ViewChild('charNumYPer') chartNumYPer: ChartComponent;
  public chartOptionsComun: Partial<ChartOptions>;
  public chartOptions1: Partial<ChartOptions>;
  public chartOptions2: Partial<ChartOptions>;
  public selectedAnomalias: Anomalia[];

  public labelsCategoria: string[];
  public coloresCategoria: string[];
  public numsCategoria: number[];

  public chartLoaded = false;
  public selectedInformeId: string;
  public informesList: string[];
  public dataPlot: DataPlot[];
  public allAnomalias: Anomalia[];
  public chartHeight = 300;

  constructor(private filterService: FilterService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    combineLatest([this.reportControlService.allFilterableElements$, this.reportControlService.informesList$]).subscribe(
      ([elems, informes]) => {
        this.allAnomalias = elems as Anomalia[];
        this.informesList = informes;

        this.dataPlot = [];
        this._getAllCategorias(this.allAnomalias);

        this.informesList.forEach((informeId) => {
          const anomaliasInforme = this.allAnomalias.filter((item) => item.informeId === informeId);
          this.dataPlot.push(this._calculateDataPlot(anomaliasInforme, informeId));
        });
        this.initChart();
      }
    );
  }

  private _getAllCategorias(anomalias): void {
    const allNumCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);

    const labelsCategoria = Array<string>();
    const coloresCategoria = Array<string>();
    const numsCategoria = Array<number>();

    allNumCategorias.forEach((i) => {
      if (anomalias.filter((anom) => anom.tipo === i).length > 0) {
        labelsCategoria.push(GLOBAL.labels_tipos[i]);
        coloresCategoria.push(GLOBAL.colores_tipos[i]);
        numsCategoria.push(i);
      }
    });
    this.labelsCategoria = labelsCategoria;
    this.coloresCategoria = coloresCategoria;
    this.numsCategoria = numsCategoria;
  }

  private _calculateDataPlot(anomalias, informeId: string): DataPlot {
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
        theme: 'dark',
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
      this.chartOptions1 = {
        series: [
          {
            name: '# Anomalias 2019',
            data: this.dataPlot[0].numPorCategoria,
          },
          {
            name: '# Anomalias 2020',
            data: this.dataPlot[1].numPorCategoria,
          },
        ],
        colors: this.coloresCategoria,
        title: {
          text: '# Anomalías',
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
            minWidth: 100,
          },
        },
      };

      this.chartOptions2 = {
        series: [
          {
            name: 'MAE 2019',
            data: this.dataPlot[0].perdidasPorCategoria,
          },
          {
            name: 'MAE 2020',
            data: this.dataPlot[1]['perdidasPorCategoria'],
          },
        ],
        title: {
          text: 'MAE',
          align: 'left',
        },
        chart: {
          id: 'tw',
          group: 'social',
          type: 'bar',
          width: '100%',

          height: this.chartHeight,
        },

        colors: [GLOBAL.gris],
        yaxis: {
          max: (v) => {
            return Math.round(1.1 * v);
          },
          forceNiceScale: true,
          tickAmount: 3,
          labels: {
            minWidth: 100,
          },
        },
      };
      this.chartLoaded = true;
    }
  }
}
