import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

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
import { GLOBAL } from '@data/constants/global';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  xaxis: ApexXAxis;
  yaxis: ApexXAxis;
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

  private currentLabel: string;
  private nextYearLabel: string;
  private fixableLabel: string;
  private unfixableLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private reportControlService: ReportControlService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkTranslate();

    // const lastReport = this.reportControlService.informes[this.reportControlService.informes.length - 1];
    // const lastReportAnoms = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === lastReport.id);

    // const fixableLastReportAnoms = lastReportAnoms.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));

    // const nextYearFixableLastReportAnoms = lastReportAnoms.filter((anom) =>
    //   GLOBAL.fixableTypes.includes(anom.tipoNextYear)
    // );

    // const fixableAnomsData = [fixableLastReportAnoms.length, nextYearFixableLastReportAnoms.length];
    // const unfixableAnomsData = [
    //   lastReportAnoms.length - fixableLastReportAnoms.length,
    //   lastReportAnoms.length - nextYearFixableLastReportAnoms.length,
    // ];

    const totalAnomsData = [1599, 1705];
    const fixableAnomsData = [259, 315];
    const unfixableAnomsData = [1340, 1390];

    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => {
      this.chartOptions = {
        series: [
          {
            name: '',
            type: 'line',
            data: totalAnomsData,
          },
          {
            name: this.fixableLabel,
            type: 'column',
            data: fixableAnomsData,
          },
          {
            name: this.unfixableLabel,
            type: 'column',
            data: unfixableAnomsData,
          },
        ],
        chart: {
          type: 'bar',
          height: 250,
          stacked: true,
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
            // distributed: true,
            // dataLabels: {
            //   position: 'top', // top, center, bottom
            // },
          },
        },
        dataLabels: {
          enabled: true,
          // offsetY: -25,
        },
        xaxis: {
          categories: [this.currentLabel, this.nextYearLabel],
          // labels: {
          //   style: {
          //     colors: [null, COLOR.lightOrange],
          //   },
          // },
        },
        yaxis: {
          min: 0,
          max:
            Math.max(...totalAnomsData) * 1.1 < Math.max(...totalAnomsData) + 1.1
              ? Math.max(...totalAnomsData) * 1.1
              : Math.max(...totalAnomsData) + 1.1,
        },
        colors: ['transparent', COLOR.dark_orange, COLOR.neutralGrey],
        // stroke: {
        //   show: true,
        //   dashArray: 10,
        //   width: 2,
        //   colors: ['transparent', COLOR.lightOrange],
        // },
        tooltip: {
          theme: theme.split('-')[0],
        },
        legend: {
          show: true,
          position: 'top',
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
            dataLabels: {
              ...this.chartOptions.dataLabels,
              style: {
                ...this.chartOptions.dataLabels.style,
                colors: [this.themeService.textColor],
              },
            },
          };
        }
      })
    );
  }

  private checkTranslate(): void {
    this.translate
      .get('Actual')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.currentLabel = res;
      });

    this.translate
      .get('Próximo año')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.nextYearLabel = res;
      });

    this.translate
      .get('Reparables')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.fixableLabel = res;
      });

    this.translate
      .get('No reparables')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.unfixableLabel = res;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
