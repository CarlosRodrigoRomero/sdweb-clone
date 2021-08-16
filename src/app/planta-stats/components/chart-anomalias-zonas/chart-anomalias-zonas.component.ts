import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { combineLatest, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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

import { GLOBAL } from '@core/services/global';
import { ReportControlService } from '@core/services/report-control.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';

import { LocationAreaInterface } from '@core/models/location';
import { Seguidor } from '@core/models/seguidor';
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
  selector: 'app-chart-anomalias-zonas',
  templateUrl: './chart-anomalias-zonas.component.html',
  styleUrls: ['./chart-anomalias-zonas.component.css'],
})
export class ChartAnomaliasZonasComponent implements OnInit, OnDestroy {
  @ViewChild('chart-anomalias-zonas') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  informesIdList: string[];
  allAnomalias: Anomalia[] = [];
  dataPlot: any[];
  zones: LocationAreaInterface[];
  chartData: number[][];
  chartLoaded = false;
  thereAreZones = true;
  private dateLabels: string[];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.plantaService
        .getLocationsArea(this.reportControlService.plantaId)
        .pipe(
          switchMap((locAreas) => {
            // si en seguidores solo hay un tamaño de area entonces no hay zonas
            if (
              !this.reportControlService.plantaFija &&
              locAreas.filter(
                (locArea) =>
                  locArea.globalCoords[1] !== undefined &&
                  locArea.globalCoords[1] !== null &&
                  locArea.globalCoords[1] !== ''
              ).length === 0
            ) {
              this.thereAreZones = false;
            }

            this.zones = locAreas.filter(
              (locArea) =>
                locArea.globalCoords[0] !== undefined &&
                locArea.globalCoords[0] !== null &&
                locArea.globalCoords[0] !== ''
            );

            // filtramos por si hay zonas con el mismo nombre
            this.zones = this.plantaService.getUniqueLargestLocAreas(this.zones);

            return combineLatest([
              this.reportControlService.allFilterableElements$,
              this.reportControlService.informesIdList$,
            ]);
          }),
          switchMap(([elems, informesId]) => {
            if (this.reportControlService.plantaFija) {
              this.allAnomalias = elems as Anomalia[];
            } else {
              (elems as Seguidor[]).forEach((seg) => this.allAnomalias.push(...seg.anomaliasCliente));
            }

            this.informesIdList = informesId;

            return this.informeService.getDateLabelsInformes(this.informesIdList);
          })
        )
        .subscribe((dateLabels) => {
          this.dateLabels = dateLabels;

          this.chartData = [];
          this.informesIdList.forEach((informeId) => {
            const anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);

            this.chartData.push(this._calculateChartData(anomaliasInforme));
          });
          this._initChart();
        })
    );
  }

  private _calculateChartData(anomalias: Anomalia[]): number[] {
    // comprobamos y el nombre de las zonas es un numero
    if (!isNaN(parseFloat(this.zones[0].globalCoords[0]))) {
      this.zones = this.zones.sort((a, b) => parseFloat(a.globalCoords[0]) - parseFloat(b.globalCoords[0]));
    }
    const result = Array<number>();
    this.zones.forEach((zone) => {
      const filtered = anomalias.filter((anom) => anom.globalCoords[0] == zone.globalCoords[0]);

      result.push(this._getMAEAnomalias(filtered));
    });
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

  private _initChart(): void {
    let series;
    // excluimos DEMO
    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
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
    } else {
      series = this.dateLabels.map((dateLabel, index) => {
        return { name: dateLabel, data: this.chartData[index] };
      });
    }

    let titleXAxis = 'Zona';

    if (this.reportControlService.nombreGlobalCoords.length > 0) {
      titleXAxis = this.reportControlService.nombreGlobalCoords[0];
    }

    // espera a que el dataPlot tenga datos
    if (this.chartData[0] !== undefined) {
      this.chartOptions = {
        series,
        chart: {
          type: 'bar',
          width: '100%',
          height: 250,
          toolbar: {
            show: true,
            offsetX: 0,
            offsetY: 0,
            tools: {
              download: true,
              selection: false,
              zoom: false,
              zoomin: false,
              zoomout: false,
              pan: false,
              reset: false,
              customIcons: [],
            },
          },
        },
        legend: {
          show: false,
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
          opacity: 1,
          colors: ['#7F7F7F', '#FF6B6B'],
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
        colors: [GLOBAL.gris],
        yaxis: {
          decimalsInFloat: 0,
          max: (v) => {
            return Math.round(1.1 * v);
          },
          forceNiceScale: true,
          tickAmount: 3,
          title: {
            text: 'MAE',
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
        },
      };
      this.chartLoaded = true;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
