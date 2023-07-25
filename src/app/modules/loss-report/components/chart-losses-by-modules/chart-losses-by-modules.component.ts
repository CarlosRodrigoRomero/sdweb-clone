import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexStroke,
  ApexXAxis,
  ApexFill,
  ApexTooltip,
  ApexTitleSubtitle,
} from 'ng-apexcharts';

import { ModuleService } from '@data/services/module.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ThemeService } from '@data/services/theme.service';
import { ZonesService } from '@data/services/zones.service';

import { Anomalia } from '@core/models/anomalia';
import { GLOBAL } from '@data/constants/global';
import { COLOR } from '@data/constants/color';
import { Subscription } from 'rxjs';
import { InformeInterface } from '@core/models/informe';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
  colors: string[];
};

@Component({
  selector: 'app-chart-losses-by-modules',
  templateUrl: './chart-losses-by-modules.component.html',
  styleUrls: ['./chart-losses-by-modules.component.css'],
})
export class ChartLossesByModulesComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  modulesLabel: string[];
  private seriesLabels = ['Reparable', 'No reparable'];
  chartData: number[][];
  chartLoaded = false;
  private anomalias: Anomalia[];
  private theme: string;
  private selectedInforme: InformeInterface;
  private maeLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private zonesService: ZonesService,
    private moduleService: ModuleService,
    private reportControlService: ReportControlService,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkTranslate();

    const locAreasWithModules = this.zonesService.locAreas.filter(
      (locArea) => locArea.modulo !== null && locArea.modulo !== undefined
    );
    this.modulesLabel = this.moduleService.getModuleBrandLabels(locAreasWithModules);

    this.anomalias = this.reportControlService.allAnomalias.filter((anom) =>
      this.moduleService.checkModule(anom.modulo)
    );

    this.subscriptions.add(
      this.themeService.themeSelected$
        .pipe(
          take(1),
          switchMap((theme) => {
            this.theme = theme;

            return this.reportControlService.selectedInformeId$;
          })
        )
        .subscribe((informeId) => {
          this.selectedInforme = this.reportControlService.informes.find((informe) => informe.id === informeId);

          this.chartData = [];

          const anomaliasInforme = this.anomalias.filter((anom) => anom.informeId === informeId);

          const fixableAnoms = anomaliasInforme.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));
          this.chartData.push(this.calculateChartData(fixableAnoms));

          const unfixableAnoms = anomaliasInforme.filter((anom) => !GLOBAL.fixableTypes.includes(anom.tipo));
          this.chartData.push(this.calculateChartData(unfixableAnoms));

          this.sortChartData();

          this.initChart(this.theme.split('-')[0]);
        })
    );
    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptions) {
          let [highlightColor, neutralColor] = this.getColorsByTheme(theme);

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
            colors: [highlightColor, neutralColor],
          };
        }
      })
    );
  }

  private calculateChartData(anomalias: Anomalia[]): number[] {
    const result = Array<number>();
    this.modulesLabel.forEach((label) => {
      const labelAnoms = anomalias.filter((anom) => this.moduleService.getModuleBrandLabel(anom.modulo) === label);

      result.push(this.getMAE(labelAnoms));
    });

    return result;
  }

  private getMAE(anomalias: Anomalia[]): number {
    return (
      (anomalias.map((anom) => GLOBAL.pcPerdidas[anom.tipo]).reduce((a, b) => a + b, 0) /
        this.selectedInforme.numeroModulos) *
      100
    );
  }

  private sortChartData() {
    // Creamos un array de índices [0, 1, 2, ..., n-1]
    let indices = Array.from({ length: this.chartData[0].length }, (_, i) => i);

    // Ordenamos los índices según la suma de los elementos correspondientes en array1 y array2
    indices.sort((a, b) => this.chartData[0][b] + this.chartData[1][b] - (this.chartData[0][a] + this.chartData[1][a]));

    // ordenamos el chartData siguiendo el orden de los indices ya ordenados
    this.chartData = [indices.map((i) => this.chartData[0][i]), indices.map((i) => this.chartData[1][i])];

    // ordenamos tambien los labels
    this.modulesLabel = indices.map((i) => this.modulesLabel[i]);
  }

  private checkTranslate(): void {
    this.translate
      .get(this.seriesLabels[0])
      .pipe(take(1))
      .subscribe((res: string) => {
        this.seriesLabels[0] = res;
      });

    this.translate
      .get(this.seriesLabels[1])
      .pipe(take(1))
      .subscribe((res: string) => {
        this.seriesLabels[1] = res;
      });

    this.translate
      .get('MAE')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeLabel = res + ' (%)';
      });
  }

  private getColorsByTheme(theme: string) {
    let highlightColor = COLOR.dark_orange;
    let neutralColor = COLOR.dark_neutral;
    if (theme === 'dark-theme') {
      highlightColor = COLOR.dark_orange;
      neutralColor = COLOR.dark_neutral;
    } else {
      highlightColor = COLOR.light_orange;
      neutralColor = COLOR.light_neutral;
    }

    return [highlightColor, neutralColor];
  }

  private initChart(theme: string): void {
    const series = this.seriesLabels.map((dateLabel, index) => {
      return { name: dateLabel, data: this.chartData[index] };
    });

    const colors = this.getColorsByTheme(theme);

    let titleXAxis = 'Fabricante';
    this.translate
      .get(titleXAxis)
      .pipe(take(1))
      .subscribe((res: string) => {
        titleXAxis = res;
      });

    // espera a que el dataPlot tenga datos
    if (this.chartData[0] !== undefined) {
      this.chartOptions = {
        series,
        chart: {
          type: 'bar',
          foreColor: this.themeService.textColor,
          stacked: true,
          height: 350,
          toolbar: {
            show: false,
          },
        },
        legend: {
          show: true,
          position: 'top',
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 4,
            distributed: false,
            dataLabels: {
              position: 'center', // top, center, bottom
            },
          },
        },
        dataLabels: {
          enabled: false,
        },
        fill: {
          // colors,
        },
        // stroke: {
        //   show: true,
        //   width: 2,
        //   colors: ['transparent'],
        // },
        xaxis: {
          categories: this.modulesLabel,
          title: {
            text: titleXAxis,
          },
        },
        colors,
        yaxis: {
          decimalsInFloat: 2,
          // forceNiceScale: true,
          title: {
            text: this.maeLabel,
          },
        },
        tooltip: {
          followCursor: false,
          x: {
            show: true,
            formatter: (v) => {
              return titleXAxis + ' ' + v;
            },
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
      };
      this.chartLoaded = true;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
