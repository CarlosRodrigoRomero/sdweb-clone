import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';

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
import { InformeInterface } from '@core/models/informe';

import { GLOBAL } from '@data/constants/global';
import { FilterService } from '@data/services/filter.service';
import { Seguidor } from '@core/models/seguidor';

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
  private seriesLabels = ['Reparable', 'No reparable'];
  chartLoaded = false;
  private maeLabel: string;
  private indexLargestZones = 0;
  private zonesLabels: string[];
  private selectedInforme: InformeInterface;
  titleZone = 'Zona';
  private anomaliasInforme: Anomalia[];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private translate: TranslateService,
    private filterService: FilterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // checkeamos las traducciones
    this.checkTranslate();

    this.subscriptions.add(
      this.plantaService
        .getLocationsArea(this.reportControlService.plantaId)
        .pipe(
          take(1),
          switchMap((locAreas) => {
            // obtenemos las zonas mayores
            if (this.reportControlService.planta.sizeZonesClusters !== undefined) {
              this.indexLargestZones = this.reportControlService.planta.sizeZonesClusters;
            }

            this.zones = locAreas.filter(
              (locArea) =>
                locArea.globalCoords[this.indexLargestZones] !== undefined &&
                locArea.globalCoords[this.indexLargestZones] !== null &&
                locArea.globalCoords[this.indexLargestZones] !== ''
            );

            this.zonesLabels = this.zones.map((zone) => zone.globalCoords[this.indexLargestZones]);

            this.allAnomalias = this.reportControlService.allAnomalias;

            return this.themeService.themeSelected$;
          }),
          take(1),
          switchMap((theme) => {
            this.theme = theme;

            this.filterService.filteredElements$.subscribe((elems) => {
              const elemsInforme = elems.filter((elem) => elem.informeId === this.reportControlService.selectedInformeId);
        
              if (this.reportControlService.plantaFija) {
                this.anomaliasInforme = elemsInforme as Anomalia[];

              } else {
                var anomalias = [];
                for (var elem of elemsInforme) {
                  anomalias.push(...(elem as Seguidor).anomaliasCliente);
                }

                this.anomaliasInforme = anomalias;
              }
        
              // detectamos cambios porque estamos utilizando la estrategia OnPush
              this.cdr.detectChanges();
            });
            return this.reportControlService.selectedInformeId$;
          })
        )
        .subscribe((informeId) => {
          this.selectedInforme = this.reportControlService.informes.find((informe) => informe.id === informeId);

          this.chartData = [];

          // añadimos las anomalias reaprables y las no reparables
          this.chartData.push(this.calculateChartData(this.anomaliasInforme, true));
          this.chartData.push(this.calculateChartData(this.anomaliasInforme));

          this.sortChartData();

          this.initChart(this.theme);
        })
    );

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptions) {
          let [highlightColor, neutralColor] = this.themeService.getColorsByTheme(theme);

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

  private calculateChartData(anomalias: Anomalia[], fixables = false): number[] {
    const result = Array<number>();
    this.zones.forEach((zone) => {
      // tslint:disable-next-line: triple-equals
      const anomsZone = anomalias.filter(
        (anom) => anom.globalCoords[this.indexLargestZones] == zone.globalCoords[this.indexLargestZones]
      );

      let filtered: Anomalia[] = anomsZone.filter((anom) => !GLOBAL.fixableTypes.includes(anom.tipo));
      if (fixables) {
        filtered = anomsZone.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));
      }

      result.push(this.getMAE(filtered));
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
    this.zonesLabels = indices.map((i) => this.zonesLabels[i]);
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

    if (this.reportControlService.nombreGlobalCoords.length > 0) {
      this.titleZone = this.reportControlService.nombreGlobalCoords[this.indexLargestZones];
    }
    this.translate
      .get(this.titleZone)
      .pipe(take(1))
      .subscribe((res: string) => {
        this.titleZone = res;
      });
  }

  private initChart(theme: string): void {
    const series = this.seriesLabels.map((label, index) => {
      return { name: label, data: this.chartData[index] };
    });

    const colors = this.themeService.getColorsByTheme(theme);

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
        //   show: false,
        //   width: 2,
        //   colors: ['transparent'],
        // },
        xaxis: {
          categories: this.zonesLabels,
          title: {
            text: this.titleZone,
          },
        },
        colors,
        yaxis: {
          decimalsInFloat: 2,
          forceNiceScale: true,
          title: {
            text: this.maeLabel,
          },
        },
        tooltip: {
          followCursor: false,
          x: {
            show: true,
            formatter: (v) => {
              return this.titleZone + ' ' + v;
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
