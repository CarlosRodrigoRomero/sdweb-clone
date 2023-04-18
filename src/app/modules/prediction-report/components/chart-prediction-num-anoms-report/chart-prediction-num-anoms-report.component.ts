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
  ApexTooltip,
  ApexStroke,
} from 'ng-apexcharts';

import { ThemeService } from '@data/services/theme.service';
import { ReportControlService } from '@data/services/report-control.service';

import { COLOR } from '@data/constants/color';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  colors: string[];
  legend: ApexLegend;
};

@Component({
  selector: 'app-chart-prediction-num-anoms-report',
  templateUrl: './chart-prediction-num-anoms-report.component.html',
  styleUrls: ['./chart-prediction-num-anoms-report.component.css'],
})
export class ChartPredictionNumAnomsReportComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  private subscriptions: Subscription = new Subscription();

  constructor(private themeService: ThemeService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    const numAnomsData = [
      this.reportControlService.allAnomalias.length,
      this.reportControlService.allAnomalias.length * 1.2,
    ];

    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => {
      this.chartOptions = {
        series: [
          {
            name: 'Actual',
            data: numAnomsData,
          },
        ],
        chart: {
          type: 'bar',
          height: 250,
          foreColor: this.themeService.textColor,
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '30%',
            // borderRadius: 8,
            distributed: true,
            dataLabels: {
              position: 'top', // top, center, bottom
            },
          },
        },
        dataLabels: {
          enabled: true,
          offsetY: -25,
        },
        xaxis: {
          categories: ['Actual', 'Próximo año'],
          labels: {
            style: {
              colors: [null, COLOR.lightOrange],
            },
          },
        },
        colors: [COLOR.neutralGrey, 'transparent'],
        stroke: {
          show: true,
          dashArray: 10,
          width: 2,
          colors: ['transparent', COLOR.lightOrange],
        },
        tooltip: {
          theme: theme.split('-')[0],
        },
        legend: {
          show: false,
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
