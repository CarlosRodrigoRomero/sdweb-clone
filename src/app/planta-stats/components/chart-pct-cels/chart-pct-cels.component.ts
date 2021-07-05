import { Component, OnInit, ViewChild } from '@angular/core';

import { combineLatest } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';

import { Anomalia } from '@core/models/anomalia';

import {
  ApexAxisChartSeries,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip,
  ApexStroke,
  ApexChart,
  ApexGrid,
  ChartType,
  ApexLegend,
  ChartComponent,
} from 'ng-apexcharts';

import { StatsService } from '@core/services/stats.service';

import { InformeInterface } from '@core/models/informe';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  title: ApexTitleSubtitle;
  fill: ApexFill;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  grid: ApexGrid;
  colors: any;
  toolbar: any;
  annotations: any;
  legend: ApexLegend;
};

@Component({
  selector: 'app-chart-pct-cels',
  templateUrl: './chart-pct-cels.component.html',
  styleUrls: ['./chart-pct-cels.component.css'],
})
export class ChartPctCelsComponent implements OnInit {
  @ViewChild('chart1') chart1: ChartComponent;
  private informesIdList: string[];
  private informes: InformeInterface[];
  private allAnomalias: Anomalia[];
  private chartHeight = 150;
  dataLoaded = false;
  private dateLabels: string[];

  public chart1options: Partial<ChartOptions>;
  public chart2options: Partial<ChartOptions>;
  public commonOptions: Partial<ChartOptions> = {
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'straight',
    },
    markers: {
      size: 6,
      hover: {
        size: 10,
      },
    },
    grid: {
      // clipMarkers: false,
    },
    xaxis: {
      // type: 'category',
      categories: ['hola'],
    },
  };

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private statsService: StatsService
  ) {}

  ngOnInit(): void {
    combineLatest([this.reportControlService.allFilterableElements$, this.reportControlService.informes$])
      .pipe(
        switchMap(([elems, informes]) => {
          this.allAnomalias = elems as Anomalia[];
          this.informes = informes;
          this.informesIdList = informes.map((informe) => informe.id);

          return this.informeService.getDateLabelsInformes(this.informesIdList);
        })
      )
      .subscribe((dateLabels) => {
        this.dateLabels = dateLabels;

        // this.commonOptions.xaxis.categories = dateLabels;

        const data1: number[] = [];
        const data2: number[] = [];
        this.informes.forEach((informe) => {
          data1.push(informe.pc_pct);

          const anomsInforme = this.allAnomalias.filter((anom) => (anom.informeId = informe.id));
          const gradientes = anomsInforme.map((anom) => anom.gradiente);
          let gradienteTotal = 0;
          gradientes.forEach((grad) => (gradienteTotal += grad));
          data2.push(gradienteTotal / anomsInforme.length);
        });

        // si solo hay un informe no mostramos el gráfico
        if (data1.length <= 1) {
          this.statsService.loadCCyGradChart = false;
        } else {
          this._initChartData(data1, data2);
        }
      });
  }

  private _initChartData(data1: number[], data2: number[]): void {
    this.chart1options = {
      series: [
        {
          name: '% CC',
          data: data1,
        },
      ],
      chart: {
        type: 'area',
        width: '100%',
        height: this.chartHeight,
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
            customIcons: [],
          },
        },
      },
      colors: ['#008FFB'],
      dataLabels: {
        enabled: true,
        formatter: (value) => Math.round(value * 100) / 100 + '%',
      },
      grid: {},
      markers: {
        size: 1,
      },
      xaxis: {
        categories: this.dateLabels,
      },
      yaxis: {
        min: 0,
        max: Math.max(...data1) + 0.5,
        tickAmount: 2,
        labels: {
          minWidth: 40,
          formatter: (value) => {
            return Math.round(value * 10) / 10 + '%';
          },
        },
      },
      stroke: {
        curve: 'straight',
      },
      annotations: {
        yaxis: [
          {
            y: 0.5, // DEMO - HAY QUE TRAER EL MAE MEDIO DEL PORTFOLIO
            borderColor: '#5b5b5c',
            borderWidth: 2,
            strokeDashArray: 10,

            label: {
              offsetX: -100,
              borderColor: '#5b5b5c',
              style: {
                fontSize: '12px',
                color: '#fff',
                background: '#5b5b5c',
              },
              text: '% CC medio portfolio',
            },
          },
        ],
      },
    };

    this.chart2options = {
      series: [
        {
          name: 'gradiente medio',
          data: data2,
        },
      ],
      chart: {
        type: 'area',
        width: '100%',
        height: this.chartHeight,
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
            customIcons: [],
          },
        },
      },
      colors: ['#546E7A'],
      yaxis: {
        min: 0,
        max: 40,
        tickAmount: 2,
        labels: {
          minWidth: 40,
          formatter: (value) => {
            return value + ' ºC';
          },
        },
      },
      annotations: {
        yaxis: [
          {
            y: 12.1,
            borderColor: '#5b5b5c',
            borderWidth: 2,
            strokeDashArray: 10,

            label: {
              offsetX: -100,
              borderColor: '#5b5b5c',
              style: {
                fontSize: '12px',
                color: '#fff',
                background: '#5b5b5c',
              },
              text: 'DT medio portfolio (ºC)',
            },
          },
        ],
      },
    };

    this.dataLoaded = true;
  }
}
