import { Component, OnInit, ViewChild } from '@angular/core';
import { switchMap, take } from 'rxjs/operators';

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

import { InformeService } from '@data/services/informe.service';
import { ModuleService } from '@data/services/module.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ThemeService } from '@data/services/theme.service';
import { ZonesService } from '@data/services/zones.service';

import { Anomalia } from '@core/models/anomalia';

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
export class ChartLossesByModulesComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  private modulesLabel: string[];
  private dateLabels: string[];
  chartData: number[][];
  chartLoaded = false;
  private anomalias: Anomalia[];

  constructor(
    private zonesService: ZonesService,
    private moduleService: ModuleService,
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    const locAreasWithModules = this.zonesService.locAreas.filter(
      (locArea) => locArea.modulo !== null && locArea.modulo !== undefined
    );
    this.modulesLabel = this.moduleService.getModuleBrandLabels(locAreasWithModules);

    this.anomalias = this.reportControlService.allAnomalias.filter((anom) =>
      this.moduleService.checkModule(anom.modulo)
    );

    this.informeService
      .getDateLabelsInformes(this.reportControlService.informesIdList)
      .pipe(
        take(1),
        switchMap((dateLabels) => {
          this.dateLabels = dateLabels;

          return this.themeService.themeSelected$;
        }),
        take(1)
      )
      .subscribe((theme) => {
        this.chartData = [];
        this.reportControlService.informesIdList.forEach((informeId) => {
          const anomaliasInforme = this.anomalias.filter((anom) => anom.informeId === informeId);

          this.chartData.push(this.calculateChartData(anomaliasInforme));
        });
        this.initChart(theme.split('-')[0]);
      });
  }

  private calculateChartData(anomalias: Anomalia[]): number[] {
    const result = Array<number>();
    this.modulesLabel.forEach((label) => {
      // tslint:disable-next-line: triple-equals
      const numAnoms = anomalias.filter((anom) => this.moduleService.getModuleBrandLabel(anom.modulo) === label).length;

      result.push(numAnoms);
    });

    return result;
  }

  private initChart(theme: string): void {
    const series = this.dateLabels.map((dateLabel, index) => {
      return { name: dateLabel, data: this.chartData[index] };
    });

    const opacity = new Array(series.length);
    for (let index = 0; index < opacity.length; index++) {
      opacity[index] = 1 - (opacity.length - (index + 1)) * 0.25;
    }

    // const colors = new Array(series.length);
    // opacity.forEach((op, index) => {
    //   colors[index] = Colors.hexToRgb(COLOR.gris, op);
    // });

    let titleXAxis = 'Zona';
    // if (this.reportControlService.nombreGlobalCoords.length > 0) {
    //   this.translate
    //     .get(this.reportControlService.nombreGlobalCoords[0])
    //     .pipe(take(1))
    //     .subscribe((res: string) => {
    //       titleXAxis = res;
    //     });
    // }

    // espera a que el dataPlot tenga datos
    if (this.chartData[0] !== undefined) {
      this.chartOptions = {
        series,
        chart: {
          type: 'bar',
          foreColor: this.themeService.textColor,
          width: '100%',
          // height: 250,
          toolbar: {
            show: false,
          },
        },
        legend: {
          show: true,
          showForSingleSeries: true,
          markers: {
            // fillColors: colors,
          },
          onItemHover: {
            highlightDataSeries: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '75%',
            endingShape: 'rounded',
          },
        },
        dataLabels: {
          enabled: false,
        },
        fill: {
          // colors,
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent'],
        },
        xaxis: {
          categories: this.modulesLabel,
          title: {
            text: titleXAxis,
          },
          labels: {
            style: {
              // Es necesario usar un fontFamily que soporte saltos de línea.
              fontFamily: 'Courier New, monospace',
            },
          },
        },
        // colors: [COLOR.gris],
        yaxis: {
          decimalsInFloat: 0,
          max: (v) => {
            return Math.round(1.1 * v);
          },
          forceNiceScale: true,
          tickAmount: 3,
          title: {
            // text: this.maeLabel,
          },
          labels: {
            minWidth: 10,
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
}
