import { Component, OnInit, ViewChild } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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

import { TranslateService } from '@ngx-translate/core';

import { ThemeService } from '@data/services/theme.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';

import { LocationAreaInterface } from '@core/models/location';
import { Anomalia } from '@core/models/anomalia';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';
import { Colors } from '@core/classes/colors';

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
  selector: 'app-chart-losses-by-zone',
  templateUrl: './chart-losses-by-zone.component.html',
  styleUrls: ['./chart-losses-by-zone.component.css'],
})
export class ChartLossesByZoneComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  chartOptions: Partial<ChartOptions>;
  chartData: number[][];
  zones: LocationAreaInterface[];
  allAnomalias: Anomalia[] = [];
  theme: string;
  private seriesLabels = ['Reparables', 'No reparables'];
  chartLoaded = false;
  private maeLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.translate
      .get('MAE')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeLabel = res;
      });

    this.subscriptions.add(
      this.plantaService
        .getLocationsArea(this.reportControlService.plantaId)
        .pipe(
          take(1),
          switchMap((locAreas) => {
            // obtenemos las zonas mayores
            this.zones = locAreas.filter(
              (locArea) =>
                locArea.globalCoords[0] !== undefined &&
                locArea.globalCoords[0] !== null &&
                locArea.globalCoords[0] !== ''
            );

            // filtramos por si hay zonas con el mismo nombre
            this.zones = this.plantaService.getUniqueLargestLocAreas(this.zones);

            this.allAnomalias = this.reportControlService.allAnomalias;

            return this.themeService.themeSelected$;
          }),
          take(1),
          switchMap((theme) => {
            this.theme = theme;

            return this.reportControlService.selectedInformeId$;
          })
        )
        .subscribe((informeId) => {
          this.chartData = [];

          const anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);

          // añadimos las anomalias reaprables y las no reparables
          this.chartData.push(this.calculateChartData(anomaliasInforme, true));
          this.chartData.push(this.calculateChartData(anomaliasInforme));

          this.initChart(this.theme.split('-')[0]);
        })
    );

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
            colors: [COLOR.dark_orange, COLOR.neutralGrey],
          };
        }
      })
    );
  }

  private calculateChartData(anomalias: Anomalia[], fixables = false): number[] {
    // ordenamos las zonas por nombre
    this.zones = this.reportControlService.sortLocAreas(this.zones);

    const result = Array<number>();
    this.zones.forEach((zone) => {
      // tslint:disable-next-line: triple-equals
      const anomsZone = anomalias.filter((anom) => anom.globalCoords[0] == zone.globalCoords[0]);

      let filtered: Anomalia[] = anomsZone.filter((anom) => !GLOBAL.fixableTypes.includes(anom.tipo));
      if (fixables) {
        filtered = anomsZone.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));
      }

      result.push(this.getMAEAnomalias(filtered));
    });

    return result;
  }

  private getMAEAnomalias(anomalias: Anomalia[]): number {
    return (
      0.1 *
      Math.round(
        10 *
          anomalias
            .map((anom) => {
              let numeroModulos: number;
              if (anom.hasOwnProperty('modulosAfectados')) {
                if (isNaN(anom.modulosAfectados)) {
                  numeroModulos = 1;
                } else {
                  numeroModulos = anom.modulosAfectados;
                }
              } else {
                numeroModulos = 1;
              }

              return GLOBAL.pcPerdidas[anom.tipo] * numeroModulos;
            })
            .reduce((a, b) => a + b, 0)
      )
    );
  }

  private initChart(theme: string): void {
    const series = this.seriesLabels.map((label, index) => {
      return { name: label, data: this.chartData[index] };
    });

    let titleXAxis = 'Zona';
    if (this.reportControlService.nombreGlobalCoords.length > 0) {
      this.translate
        .get(this.reportControlService.nombreGlobalCoords[0])
        .pipe(take(1))
        .subscribe((res: string) => {
          titleXAxis = res;
        });
    }

    // espera a que el dataPlot tenga datos
    if (this.chartData[0] !== undefined) {
      this.chartOptions = {
        series,
        chart: {
          type: 'bar',
          foreColor: this.themeService.textColor,
          // height: 250,
          stacked: true,
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
            columnWidth: '30%',
            // borderRadius: 8,
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
        stroke: {
          show: false,
          width: 2,
          colors: ['transparent'],
        },
        xaxis: {
          categories: this.zones.map((zone) => zone.globalCoords[0]),
          title: {
            text: titleXAxis,
          },
        },
        colors: [COLOR.dark_orange, COLOR.neutralGrey],
        yaxis: {
          decimalsInFloat: 0,
          max: (v) => {
            return Math.round(1.1 * v);
          },
          forceNiceScale: true,
          tickAmount: 3,
          title: {
            text: this.maeLabel,
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
