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
  fill: ApexFill;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  colors: string[];
  legend: ApexLegend;
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
    const greyColor = '#64748B';
    const lightOrangeColor = '#FED7AA';

    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => {
      this.chartOptions = {
        series: [
          {
            name: 'Actual',
            data: [300, 350],
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
            columnWidth: '25%',
            borderRadius: 8,
            distributed: true,
            // dataLabels: {
            //   position: 'top', // top, center, bottom
            // },
          },
        },
        dataLabels: {
          enabled: false,
          //   formatter: (val) => {
          //     return val + '%';
          //   },
          //   offsetY: -20,
          //   style: {
          //     fontSize: '12px',
          //   },
        },
        xaxis: {
          categories: ['Actual', 'Próximo año'],
          labels: {
            style: {
              colors: [null, lightOrangeColor],
            },
          },
        },
        colors: [greyColor, lightOrangeColor],
        // fill: {
        //   opacity: 1,
        //   colors: [greyColor, lightOrangeColor],
        // },
        // stroke: {
        //   show: true,
        //   dashArray: 10,
        //   width: 5,
        //   colors: ['transparent', lightOrangeColor],
        // },
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
