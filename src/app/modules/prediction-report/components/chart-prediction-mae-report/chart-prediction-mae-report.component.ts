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

    // const [maeTotalData, maeFixableData, maeUnfixableData] = this.calculateFakeData(lastReport.numeroModulos);

    this.themeService.themeSelected$.pipe(take(1)).subscribe((theme) => {
      this.chartOptions = {
        series: [
          {
            name: '',
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
        colors: ['transparent', COLOR.dark_orange, COLOR.dark_neutral],
        legend: {
          show: true,
          position: 'top',
        },
        // fill: {
        //   type: 'gradient',
        //   gradient: {
        //     shade: 'dark',
        //     gradientToColors: [COLOR.light_neutral, COLOR.light_orange],
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
          background: {
            enabled: true,
            foreColor: this.themeService.surfaceColor,
            // borderColor: this.themeService.textColor,
          },
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
          let highlightColor = COLOR.dark_orange;
          let neutralColor = COLOR.dark_neutral;
          if (theme === 'dark-theme') {
            highlightColor = COLOR.dark_orange;
            neutralColor = COLOR.dark_neutral;
          } else {
            highlightColor = COLOR.light_orange;
            neutralColor = COLOR.light_neutral;
          }

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
                colors: [this.themeService.surfaceColor],
              },
              background: {
                ...this.chartOptions.dataLabels.background,
                foreColor: this.themeService.textColor,
              },
            },
            colors: ['transparent', highlightColor, neutralColor],
          };
        }
      })
    );
  }

  private calculateFakeData(moduleNumber: number) {
    const tipos = [3, 7, 10, 14, 15, 17, 18];
    const numByTipo = [62, 1, 2, 6, 37, 140, 1399];
    const newNumByTipo = [69, 1, 2, 8, 37, 150, 1399];

    const fixableTipos = tipos.filter((tipo) => GLOBAL.fixableTypes.includes(tipo));

    let fixableLosses = 0;
    let fixableLossesNextYear = 0;
    fixableTipos.forEach((tipo) => {
      const index = tipos.indexOf(tipo);
      const num = numByTipo[index];
      fixableLosses += GLOBAL.pcPerdidas[tipo] * num;

      const newNum = newNumByTipo[index];
      fixableLossesNextYear += GLOBAL.pcPerdidas[tipo] * newNum;
    });

    const unfixableTipos = tipos.filter((tipo) => !GLOBAL.fixableTypes.includes(tipo));

    let unfixableLosses = 0;
    let unfixableLossesNextYear = 0;
    unfixableTipos.forEach((tipo) => {
      const index = tipos.indexOf(tipo);
      const num = numByTipo[index];
      unfixableLosses += GLOBAL.pcPerdidas[tipo] * num;

      const newNum = newNumByTipo[index];
      unfixableLossesNextYear += GLOBAL.pcPerdidas[tipo] * newNum;
    });

    const maeFixable = (fixableLosses / moduleNumber) * 100;
    const maeFixableNextYear = (fixableLossesNextYear / moduleNumber) * 100;
    const maeUnfixable = (unfixableLosses / moduleNumber) * 100;
    const maeUnfixableNextYear = (unfixableLossesNextYear / moduleNumber) * 100;

    return [
      [maeFixable + maeUnfixable, maeFixableNextYear + maeUnfixableNextYear],
      [maeFixable, maeFixableNextYear],
      [maeUnfixable, maeUnfixableNextYear],
    ];
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
