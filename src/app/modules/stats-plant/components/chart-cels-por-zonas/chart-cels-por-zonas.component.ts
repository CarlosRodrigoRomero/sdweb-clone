import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

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
import { ZonesService } from '@data/services/zones.service';
import { ThemeService } from '@data/services/theme.service';

import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';

import { Colors } from '@core/classes/colors';

import { COLOR } from '@data/constants/color';

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
  selector: 'app-chart-cels-por-zonas',
  templateUrl: './chart-cels-por-zonas.component.html',
  styleUrls: ['./chart-cels-por-zonas.component.css'],
})
export class ChartCelsPorZonasComponent implements OnInit, OnDestroy {
  @ViewChild('chart-anomalias-zonas') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  informesIdList: string[];
  allAnomalias: Anomalia[] = [];
  zones: LocationAreaInterface[];
  chartData: number[][];
  chartLoaded = false;
  private dateLabels: string[];
  private celsCalientesLabel: string;
  private zonaLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    private zonesService: ZonesService,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkTranslate();

    this.zones = this.zonesService.zonesBySize[0];

    // filtramos por si hay zonas con el mismo nombre
    this.zones = this.plantaService.getUniqueLargestLocAreas(this.zones);

    this.informesIdList = this.reportControlService.informesIdList;

    this.allAnomalias = this.reportControlService.allAnomalias;

    this.subscriptions.add(
      this.informeService
        .getDateLabelsInformes(this.informesIdList)
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
          this.informesIdList.forEach((informeId) => {
            const anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);

            // tslint:disable-next-line: triple-equals
            const celscalInforme = anomaliasInforme.filter((anom) => anom.tipo == 8 || anom.tipo == 9);

            this.chartData.push(this._calculateChartData(celscalInforme));
          });

          // Calculamos la data del gráfico para todos los informes
          this.informesIdList.forEach((informeId) => {
            const anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);

            // tslint:disable-next-line: triple-equals
            const celscalInforme = anomaliasInforme.filter((anom) => anom.tipo == 8 || anom.tipo == 9);
            this.chartData.push(this._calculateChartData(celscalInforme));
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
            // tslint:disable-next-line: triple-equals
            const celscalInforme = anomaliasInforme.filter((anom) => anom.tipo == 8 || anom.tipo == 9);
            this.chartData.push(this._calculateChartData(celscalInforme));
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

  private _calculateChartData(anomalias: Anomalia[]): number[] {
    let result: number[] = [];
    this.zones.forEach((zone) => {
      const filtered = anomalias.filter((anom) => anom.globalCoords[0] == zone.globalCoords[0]);
      result.push(Math.round(filtered.length));
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

  private _initChart(theme: string): void {
    let series;
    // excluimos DEMO
    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      if (this.dateLabels.length > 1) {
        series = [
          {
            name: 'CC por Zonas 2019',
            data: [32, 45, 58],
          },
          {
            name: 'CC por Zonas 2020',
            data: [40, 38, 50],
          },
        ];
      } else if (this.dateLabels[0] === 'Jul 2019') {
        series = [
          {
            name: 'CC por Zonas 2019',
            data: [32, 45, 58],
          },
        ];
      } else {
        series = [
          {
            name: 'CC por Zonas 2020',
            data: [40, 38, 50],
          },
        ];
      }
    } else {
      series = this.dateLabels.map((dateLabel, index) => {
        return { name: dateLabel, data: this.chartData[index] };
      });
    }

    let titleXAxis = this.zonaLabel;

    if (this.reportControlService.nombreGlobalCoords.length > 0) {
      this.translate
        .get(this.reportControlService.nombreGlobalCoords[0])
        .pipe(take(1))
        .subscribe((res: string) => {
          titleXAxis = res;
        });
    }

    // espera a que el charData tenga datos
    if (this.chartData[0] !== undefined) {
      const opacity = new Array(series.length);
      for (let index = 0; index < opacity.length; index++) {
        opacity[index] = 1 - (opacity.length - (index + 1)) * 0.25;
      }

      const colors = new Array(series.length);
      opacity.forEach((op, index) => {
        colors[index] = Colors.hexToRgb(COLOR.gris, op);
      });

      this.chartOptions = {
        series,
        chart: {
          type: 'bar',
          height: 240,
          width: '100%',
          foreColor: this.themeService.textColor,
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
            text: '# ' + this.celsCalientesLabel,
          },
          labels: {
            minWidth: 10,
            formatter: (value) => {
              return Math.round(value).toString();
            },
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

  private checkTranslate(): void {
    this.translate
      .get('Céls. calientes')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.celsCalientesLabel = res;
      });

    this.translate
      .get('zona')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.zonaLabel = res;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
