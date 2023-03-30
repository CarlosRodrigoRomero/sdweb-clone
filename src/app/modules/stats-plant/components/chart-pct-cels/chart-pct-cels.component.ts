import { Component, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';

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
  ApexLegend,
  ChartComponent,
} from 'ng-apexcharts';

import { StatsService } from '@data/services/stats.service';
import { ThemeService } from '@data/services/theme.service';

import { InformeInterface } from '@core/models/informe';
import { MathOperations } from '@core/classes/math-operations';
import { COLOR } from '@data/constants/color';

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
  grid: any; // ApexGrid;
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
  public commonOptions: Partial<ChartOptions>;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private statsService: StatsService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.allAnomalias = this.reportControlService.allAnomalias;
    this.informes = this.reportControlService.informes;
    this.informesIdList = this.informes.map((informe) => informe.id);

    this.informeService
      .getDateLabelsInformes(this.informesIdList)
      .pipe(
        take(1),
        switchMap((dateLabels) => {
          this.dateLabels = dateLabels;

          return this.themeService.themeSelected$;
        }),
        take(1)
      )
      .subscribe((theme) => {
        const data1: number[] = [];
        const data2: number[] = [];
        this.informes.forEach((informe) => {
          data1.push(informe.cc * 100);

          const anomsInforme = this.allAnomalias.filter((anom) => anom.informeId === informe.id);
          const gradientes = anomsInforme
            .filter((anom) => anom.gradienteNormalizado !== undefined)
            .map((anom) => anom.gradienteNormalizado);
          const gradienteTotal = MathOperations.sumArray(gradientes);

          data2.push(Number((gradienteTotal / anomsInforme.length).toFixed(2)));
        });

        // si solo hay un informe no mostramos el gráfico
        if (this.informes.length > 1) {
          this._initChartData(data1, data2, theme.split('-')[0]);
        } else {
          this.statsService.loadCCyGradChart = false;
        }
      });

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.commonOptions && this.chart1options && this.chart2options) {
          this.commonOptions = {
            ...this.commonOptions,
            tooltip: {
              theme: theme.split('-')[0],
            },
          };

          this.chart1options = {
            ...this.chart1options,
            chart: {
              ...this.chart1options.chart,
              foreColor: this.themeService.textColor,
            },
          };

          this.chart2options = {
            ...this.chart2options,
            chart: {
              ...this.chart2options.chart,
              foreColor: this.themeService.textColor,
            },
          };
        }
      })
    );
  }

  private _initChartData(data1: number[], data2: number[], theme: string): void {
    this.commonOptions = {
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
      grid: {
        clipMarkers: false,
      },
      xaxis: {
        type: 'category',
        categories: ['Jul 2019', 'Jun 2020'],
      },
    };

    this.chart1options = {
      series: [
        {
          name: '% CC',
          data: data1,
        },
      ],
      chart: {
        id: '%CC',
        type: 'area',
        width: '100%',
        height: this.chartHeight,
        group: 'groupCC',
        foreColor: this.themeService.textColor,
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
      colors: [COLOR.gris],
      dataLabels: {
        enabled: true,
        formatter: (value) => Math.round(value * 100) / 100 + '%',
      },
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
          minWidth: 10,
          formatter: (value) => {
            return Number(value.toFixed(2)) + '%';
          },
        },
      },
      stroke: {
        curve: 'straight',
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
        id: 'gradiente',
        type: 'area',
        width: '100%',
        height: this.chartHeight,
        group: 'groupCC',
        foreColor: this.themeService.textColor,
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
      colors: [COLOR.gris],
      dataLabels: {
        enabled: true,
        formatter: (value) => Math.round(value * 10) / 10 + ' ºC',
      },
      markers: {
        size: 1,
      },
      xaxis: {
        categories: this.dateLabels,
      },
      yaxis: {
        min: 0,
        max: Math.max(...data2) + 5,
        tickAmount: 2,
        labels: {
          minWidth: 10,
          formatter: (value) => {
            return Number(value.toFixed(1)) + ' ºC';
          },
        },
      },
    };

    this.dataLoaded = true;
  }
}
