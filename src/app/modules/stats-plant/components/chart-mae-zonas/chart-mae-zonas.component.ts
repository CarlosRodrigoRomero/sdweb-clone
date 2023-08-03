import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';
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

import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';
import { InformeService } from '@data/services/informe.service';
import { ThemeService } from '@data/services/theme.service';

import { LocationAreaInterface } from '@core/models/location';
import { Anomalia } from '@core/models/anomalia';

import { Colors } from '@core/classes/colors';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

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
  selector: 'app-chart-mae-zonas',
  templateUrl: './chart-mae-zonas.component.html',
  styleUrls: ['./chart-mae-zonas.component.css'],
})
export class ChartMaeZonasComponent implements OnInit, OnDestroy {
  @ViewChild('chart-anomalias-zonas') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  informesIdList: string[];
  allAnomalias: Anomalia[] = [];
  dataPlot: any[];
  zones: LocationAreaInterface[];
  chartData: number[][];
  chartLoaded = false;
  private dateLabels: string[];
  private maeLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
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

            this.informesIdList = this.reportControlService.informesIdList;

            this.allAnomalias = this.reportControlService.allAnomalias;

            return this.informeService.getDateLabelsInformes(this.informesIdList);
          }),
          take(1),
          switchMap((dateLabels) => {
            this.dateLabels = dateLabels;

            return this.themeService.themeSelected$;
          }),
          take(1)
        )
        .subscribe((theme) => {
          this.chartData = [];
          // Calculamos la data del gráfico para todos los informes
          this.informesIdList.forEach((informeId) => {
            const anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);
            this.chartData.push(this._calculateChartData(anomaliasInforme));
          });

          // Ordenamos this.zones según el último informe
          const lastChartData = this.chartData[this.chartData.length - 1];
          const zonesWithIndices: any[] = this.zones.map((zone, index) => [index, zone]);
          zonesWithIndices.sort((a, b) => lastChartData[b[0]] - lastChartData[a[0]]);
          this.zones = zonesWithIndices.map((pair) => pair[1]);

          // Recalculamos la data del gráfico para todos los informes
          this.chartData = [];
          this.informesIdList.forEach((informeId) => {
            const anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);
            this.chartData.push(this._calculateChartData(anomaliasInforme));
          });

          this._initChart(theme.split('-')[0]);
        })
    );

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptions) {
          this.chartOptions = {
            ...this.chartOptions,
            chart: {
              type: 'bar',
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

  private _calculateChartData(anomalias: Anomalia[]): number[] {
    let result: number[] = [];
    this.zones.forEach((zone) => {
      const filtered = anomalias.filter((anom) => anom.globalCoords[0] == zone.globalCoords[0]);
      result.push(this._getMAEAnomalias(filtered));
    });

    // Creamos un array de pares [índice, valor] para result
    const resultWithIndices = result.map((value, index) => [index, value]);

    // Ordenamos el array de pares de acuerdo con los valores
    resultWithIndices.sort((a, b) => b[1] - a[1]);

    // Ordenamos this.zones y result de acuerdo con el orden de resultWithIndices
    this.zones = resultWithIndices.map((pair) => this.zones[pair[0]]);
    result = resultWithIndices.map((pair) => pair[1]);

    return result;
  }

  private _getMAEAnomalias(anomalias: Anomalia[]): number {
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

  private _initChart(theme: string): void {
    let series;
    // excluimos DEMO
    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      if (this.dateLabels.length > 1) {
        series = [
          {
            name: 'MAE por Zonas 2019',
            data: [1, 3, 3],
          },
          {
            name: 'MAE por Zonas 2020',
            data: [2, 1, 1],
          },
        ];
      } else if (this.dateLabels[0] === 'Jul 2019') {
        series = [
          {
            name: 'MAE por Zonas 2019',
            data: [1, 3, 3],
          },
        ];
      } else {
        series = [
          {
            name: 'MAE por Zonas 2020',
            data: [2, 1, 1],
          },
        ];
      }
    } else {
      series = this.dateLabels.map((dateLabel, index) => {
        return { name: dateLabel, data: this.chartData[index] };
      });
    }

    const opacity = new Array(series.length);
    for (let index = 0; index < opacity.length; index++) {
      opacity[index] = 1 - (opacity.length - (index + 1)) * 0.25;
    }

    const colors = new Array(series.length);
    opacity.forEach((op, index) => {
      colors[index] = Colors.hexToRgb(COLOR.gris, op);
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
          width: '100%',
          height: 250,
          toolbar: {
            show: false,
          },
        },
        legend: {
          show: true,
          showForSingleSeries: true,
          markers: {
            fillColors: colors,
          },
          onItemHover: {
            highlightDataSeries: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '75%',
            // endingShape: 'rounded',
          },
        },
        dataLabels: {
          enabled: false,
        },
        fill: {
          colors,
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent'],
        },
        xaxis: {
          categories: this.zones.map((zone) => zone.globalCoords[0]),
          title: {
            text: titleXAxis,
          },
        },
        colors: [COLOR.gris],
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

      // detectamos cambios porque estamos utilizando la estrategia OnPush
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
