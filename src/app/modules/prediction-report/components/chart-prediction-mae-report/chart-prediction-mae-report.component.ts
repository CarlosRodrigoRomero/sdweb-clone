import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

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
  ApexFill,
  ApexTooltip,
  ApexStroke,
  ApexYAxis,
  ApexMarkers,
} from 'ng-apexcharts';

import { ThemeService } from '@data/services/theme.service';
import { ReportControlService } from '@data/services/report-control.service';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';
import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';

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
  plotOptions: ApexPlotOptions;
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

  private currentLabel: string;
  private nextYearLabel: string;
  private maeTotalLabel: string;
  private maeFixableLabel: string;
  private maeUnfixableLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private decimalPipe: DecimalPipe,
    private reportControlService: ReportControlService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkTranslate();

    const lastReport = this.reportControlService.informes[this.reportControlService.informes.length - 1];
    const lastReportAnoms = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === lastReport.id);

    const fixableLastReportAnoms = lastReportAnoms.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));
    const maeFixableLastReport = this.getMaeByAnoms(lastReport, fixableLastReportAnoms);
    const unfixableLastReportAnoms = lastReportAnoms.filter((anom) => !GLOBAL.fixableTypes.includes(anom.tipo));
    const maeUnfixableLastReport = this.getMaeByAnoms(lastReport, unfixableLastReportAnoms);

    const fixableNextYearAnoms = lastReportAnoms.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipoNextYear));
    const maeFixableNextYear = this.getMaeByAnoms(lastReport, fixableNextYearAnoms, true);
    const unfixableNextYearAnoms = lastReportAnoms.filter((anom) => !GLOBAL.fixableTypes.includes(anom.tipoNextYear));
    const maeUnfixableNextYear = this.getMaeByAnoms(lastReport, unfixableNextYearAnoms, true);

    const maeTotalData = [maeFixableLastReport + maeUnfixableLastReport, maeFixableNextYear + maeUnfixableNextYear];
    const maeFixableData = [maeFixableLastReport, maeFixableNextYear];
    const maeUnfixableData = [maeUnfixableLastReport, maeUnfixableNextYear];

    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => {
      this.chartOptions = {
        series: [
          {
            name: this.maeTotalLabel + ' %',
            type: 'line',
            data: maeTotalData,
          },
          {
            name: this.maeFixableLabel + ' %',
            type: 'column',
            data: maeFixableData,
          },
          {
            name: this.maeUnfixableLabel + ' %',
            type: 'column',
            data: maeUnfixableData,
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
        xaxis: {
          categories: [this.currentLabel, this.nextYearLabel],
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
            Math.max(...maeTotalData) * 1.1 < Math.max(...maeTotalData) + 1.1
              ? Math.max(...maeTotalData) * 1.1
              : Math.max(...maeTotalData) + 1.1,
        },
        colors: ['transparent', COLOR.dark_orange, COLOR.neutralGrey],
        legend: {
          show: true,
          position: 'top',
        },
        // fill: {
        //   type: 'gradient',
        //   gradient: {
        //     shade: 'dark',
        //     gradientToColors: [COLOR.neutralGrey, COLOR.lightOrange],
        //     shadeIntensity: 1,
        //     type: 'horizontal',
        //     opacityFrom: 1,
        //     opacityTo: 1,
        //     stops: [0, 100, 100, 100],
        //   },
        // },
        // stroke: {
        //   dashArray: 10,
        //   width: 3,
        // },
        tooltip: {
          theme: theme.split('-')[0],
        },
        dataLabels: {
          enabled: true,
          formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + '%',
          style: {
            fontSize: '12px',
            // colors: [this.themeService.surfaceColor],
          },
          // background: {
          //   enabled: true,
          //   foreColor: this.themeService.textColor,
          //   borderColor: this.themeService.textColor,
          // },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '30%',
            // borderRadius: 8,
            // distributed: true,
            dataLabels: {
              position: 'center', // top, center, bottom
            },
          },
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

  private getMaeByAnoms(report: InformeInterface, anoms: Anomalia[], nextYear = false): number {
    let losses = 0;

    let types: number[] = [];
    if (nextYear) {
      types = anoms.map((anom) => anom.tipoNextYear);
    } else {
      types = anoms.map((anom) => anom.tipo);
    }

    types.forEach((type) => {
      losses += GLOBAL.pcPerdidas[type];
    });

    const mae = (losses / report.numeroModulos) * 100;

    return mae;
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
      .get('MAE total')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeTotalLabel = res;
      });

    this.translate
      .get('MAE reparable')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeFixableLabel = res;
      });

    this.translate
      .get('MAE no reparable')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeUnfixableLabel = res;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
