import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

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
} from 'ng-apexcharts';

import { ThemeService } from '@data/services/theme.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  xaxis: ApexXAxis;
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-chart-losses-report',
  templateUrl: './chart-losses-report.component.html',
  styleUrls: ['./chart-losses-report.component.css'],
})
export class ChartLossesReportComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  private subscriptions: Subscription = new Subscription();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => {
      this.chartOptions = {
        series: [
          {
            name: 'Reparables',
            data: [44, 55],
          },
          {
            name: 'No reparables',
            data: [13, 23],
          },
        ],
        chart: {
          type: 'bar',
          height: 350,
          stacked: true,
          zoom: {
            enabled: true,
          },
          foreColor: this.themeService.textColor,
          toolbar: {
            show: false,
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              legend: {
                position: 'bottom',
                offsetX: -10,
                offsetY: 0,
              },
            },
          },
        ],
        plotOptions: {
          bar: {
            horizontal: false,
          },
        },
        xaxis: {
          type: 'category',
          categories: ['Actual', 'Próximo año'],
        },
        legend: {
          position: 'top',
        },
        fill: {
          opacity: 1,
        },
        tooltip: {
          theme: theme.split('-')[0],
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
