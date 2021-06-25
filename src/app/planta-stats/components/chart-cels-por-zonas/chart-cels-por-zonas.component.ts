import { Component, OnInit, ViewChild } from '@angular/core';

import { combineLatest } from 'rxjs';

import { GLOBAL } from '@core/services/global';
import { ReportControlService } from '@core/services/report-control.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';

import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';

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
export class ChartCelsPorZonasComponent implements OnInit {
  @ViewChild('chart-anomalias-zonas') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  informesIdList: string[];
  allAnomalias: Anomalia[];
  zones: LocationAreaInterface[];
  chartData: number[][];
  chartLoaded = false;
  thereAreZones = true;
  private dateLabels: string[];

  constructor(
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
  }

  private _calculateChartData(anomalias: Anomalia[]): number[] {
    const result = Array<number>();
    this.zones.forEach((zone) => {
      const filtered = anomalias.filter((anom) => anom.globalCoords[0] == zone.globalCoords[0]);
      result.push(Math.round(filtered.length));
    });
    return result;
  }

  private _initChart(): void {
    const series = this.dateLabels.map((dateLabel, index) => {
      return { name: dateLabel, data: this.chartData[index] };
    });

    // espera a que el charData tenga datos
    if (this.chartData[0] !== undefined) {
      this.chartOptions = {
        series,
        chart: {
          type: 'bar',
          height: 240,
          width: '100%',
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
            text: '# CC',
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
