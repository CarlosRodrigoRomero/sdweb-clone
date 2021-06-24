import { Component, OnInit, ViewChild } from '@angular/core';

import { combineLatest } from 'rxjs';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { ReportControlService } from '@core/services/report-control.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';

import { Anomalia } from '@core/models/anomalia';

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
import { switchMap } from 'rxjs/operators';
import { LocationAreaInterface } from '@core/models/location';

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
export class ChartAnomaliasZonasComponent implements OnInit {
  @ViewChild('chart-anomalias-zonas') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  informesIdList: string[];
  allAnomalias: Anomalia[];
  dataPlot: any[];
  zones: LocationAreaInterface[];
  chartData: number[][];
  chartLoaded = false;
  thereAreZones = true;
  private dateLabels: string[];

  constructor(
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
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

          return combineLatest([
            this.reportControlService.allFilterableElements$,
            this.reportControlService.informesIdList$,
          ]);
        }),
        switchMap(([elems, informesId]) => {
          this.allAnomalias = elems as Anomalia[];
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
      });

    /*  this.zonas = ['1', '2', '3', '4', '5', '6', '7', '8']; // DEMO

    combineLatest([
      this.reportControlService.allFilterableElements$,
      this.reportControlService.informesIdList$,
    ]).subscribe(([elems, informes]) => {
      this.allAnomalias = elems as Anomalia[];
      this.informesIdList = informes;

      this.chartData = [];
      this.informesIdList.forEach((informeId) => {
        const anomaliasInforme = this.allAnomalias.filter((item) => item.informeId === informeId);
        this.chartData.push(this._calculateChartData(anomaliasInforme));
      });
      this._initChart();
    }); */
  }

  private _calculateChartData(anomalias: Anomalia[]): number[] {
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
    const series = this.dateLabels.map((dateLabel, index) => {
      return { name: dateLabel, data: this.chartData[index] };
    });

    // espera a que el dataPlot tenga datos
    if (this.chartData[0] !== undefined) {
      this.chartOptions = {
        series,
        chart: {
          type: 'bar',
          height: 240,
          width: '100%',
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
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent'],
        },
        xaxis: {
          categories: this.zones.map((zone) => zone.globalCoords[0]),
          title: {
            text: 'Zonas',
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
        },
        fill: {
          opacity: 1,
        },
        tooltip: {
          followCursor: false,
          theme: 'dark',
          x: {
            show: false,
          },
          marker: {
            show: false,
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
}
