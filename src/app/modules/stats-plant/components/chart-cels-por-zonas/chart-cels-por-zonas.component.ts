import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';
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

import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';
import { InformeService } from '@data/services/informe.service';
import { ZonesService } from '@data/services/zones.service';

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
  thereAreZones = true;
  private dateLabels: string[];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    this.zones = this.zonesService.zonesBySize[0];

    // filtramos por si hay zonas con el mismo nombre
    this.zones = this.plantaService.getUniqueLargestLocAreas(this.zones);

    this.informesIdList = this.reportControlService.informesIdList;

    this.allAnomalias = this.reportControlService.allAnomalias;

    this.subscriptions.add(
      this.informeService.getDateLabelsInformes(this.informesIdList).subscribe((dateLabels) => {
        this.dateLabels = dateLabels;

        this.chartData = [];
        this.informesIdList.forEach((informeId) => {
          const anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);

          // tslint:disable-next-line: triple-equals
          const celscalInforme = anomaliasInforme.filter((anom) => anom.tipo == 8 || anom.tipo == 9);

          this.chartData.push(this._calculateChartData(celscalInforme));
        });
        this._initChart();
      })
    );
  }

  private _calculateChartData(anomalias: Anomalia[]): number[] {
    // ordenamos las zonas por nombre
    this.zones = this.reportControlService.sortLocAreas(this.zones);

    const result = Array<number>();
    this.zones.forEach((zone) => {
      // tslint:disable-next-line: triple-equals
      const filtered = anomalias.filter((anom) => anom.globalCoords[0] == zone.globalCoords[0]);
      result.push(Math.round(filtered.length));
    });
    return result;
  }

  private _initChart(): void {
    let series;
    // excluimos DEMO
    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
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
    } else {
      series = this.dateLabels.map((dateLabel, index) => {
        return { name: dateLabel, data: this.chartData[index] };
      });
    }

    let titleXAxis = 'Zona';

    if (this.reportControlService.nombreGlobalCoords.length > 0) {
      titleXAxis = this.reportControlService.nombreGlobalCoords[0];
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
            text: '# CC',
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
        },
      };
      this.chartLoaded = true;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
