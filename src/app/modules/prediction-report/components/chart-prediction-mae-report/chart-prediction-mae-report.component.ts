import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexResponsive,
  ApexXAxis,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexStroke,
  ApexYAxis,
} from 'ng-apexcharts';

import { ThemeService } from '@data/services/theme.service';
import { ReportControlService } from '@data/services/report-control.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  responsive: ApexResponsive[];
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  legend: ApexLegend;
  fill: ApexFill;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  colors: string[];
};

@Component({
  selector: 'app-chart-prediction-mae-report',
  templateUrl: './chart-prediction-mae-report.component.html',
  styleUrls: ['./chart-prediction-mae-report.component.css'],
  providers: [DecimalPipe],
})
export class ChartPredictionMaeReportComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private decimalPipe: DecimalPipe,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    const lastReport = this.reportControlService.informes[this.reportControlService.informes.length - 1];
    // const maeData = [lastReport.mae, lastReport.predMae];
    const maeData = [0.2, 0.21];

    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => {
      this.chartOptions = {
        series: [
          {
            name: 'MAE %',
            data: maeData,
          },
        ],
        chart: {
          type: 'line',
          height: 250,
          foreColor: this.themeService.textColor,
          toolbar: {
            show: false,
          },
        },
        xaxis: {
          categories: ['Actual', 'Próximo año'],
        },
        yaxis: {
          labels: {
            formatter: (value) => {
              return this.decimalPipe.transform(value, '1.0-2');
            },
            minWidth: 10,
          },
          tickAmount: 3,
          min: 0,
          max:
            Math.max(...maeData) * 1.1 < Math.max(...maeData) + 1.1
              ? Math.max(...maeData) * 1.1
              : Math.max(...maeData) + 1.1,
        },
        colors: ['#FED7AA'],
        legend: {
          show: false,
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            gradientToColors: ['#64748B', '#FED7AA'],
            shadeIntensity: 1,
            type: 'horizontal',
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 100, 100, 100],
          },
        },
        stroke: {
          dashArray: 10,
        },
        tooltip: {
          theme: theme.split('-')[0],
        },
        dataLabels: {
          enabled: true,
          formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + '%',
          style: {
            fontSize: '16px',
          },
          // background: {
          //   enabled: true,
          //   foreColor: '#000',
          // },
        },
      };
    });

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptions) {
          this.chartOptions = {
            ...this.chartOptions,
            chart: {
              ...this.chartOptions.chart,
              foreColor: this.themeService.textColor,
            },
            tooltip: {
              theme: theme.split('-')[0],
            },
          };
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
