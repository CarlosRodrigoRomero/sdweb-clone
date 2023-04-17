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
  ApexStroke,
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
  stroke: ApexStroke;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-chart-mae-report',
  templateUrl: './chart-mae-report.component.html',
  styleUrls: ['./chart-mae-report.component.css'],
})
export class ChartMaeReportComponent implements OnInit, OnDestroy {
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
            type: 'column',
            data: [0.2, 0.25],
          },
          {
            name: 'No reparables',
            type: 'column',
            data: [0.1, 0.15],
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
            columnWidth: '20%',
            // dataLabels: {
            //   position: 'top', // top, center, bottom
            // },
          },
        },
        // dataLabels: {
        //   enabled: true,
        //   formatter: (val) => {
        //     return val + '%';
        //   },
        //   offsetY: -20,
        //   style: {
        //     fontSize: '12px',
        //   },
        // },
        xaxis: {
          type: 'category',
          categories: ['Actual', 'Próximo año'],
        },
        legend: {
          position: 'top',
        },
        fill: {
          opacity: 1,
          // colors: ['#975252', '#000000'],
        },
        stroke: {
          show: true,
          dashArray: [0, 10],
          width: 1,
          colors: ['#F3CD90', '#FFFFFF'],
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
