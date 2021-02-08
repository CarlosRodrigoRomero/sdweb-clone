import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Anomalia } from '@core/models/anomalia';
import { AnomaliaService } from '@core/services/anomalia.service';
import { GLOBAL } from '@core/services/global';

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
import { take } from 'rxjs/operators';

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
  plantaId: string;
  informesList: string[];
  allAnomalias: Anomalia[];
  dataPlot: any[];
  zonas: string[];
  chartData: number[][];
  chartLoaded = false;

  constructor(private route: ActivatedRoute, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];
    this.zonas = ['1', '2', '3', '4', '5', '6', '7', '8'];

    this.anomaliaService
      .getAnomaliasPlanta$(this.plantaId)
      .pipe(take(1))
      .subscribe((anomalias) => {
        this.allAnomalias = anomalias;
        // this._getAllCategorias(anomalias);
        this.chartData = [];
        this.informesList.forEach((informeId) => {
          const anomaliasInforme = this.allAnomalias.filter((item) => item.informeId == informeId);
          this.chartData.push(this._calculateChartData(anomaliasInforme));
        });
        this._initChart();
      });
  }

  private _calculateChartData(anomalias: Anomalia[]): number[] {
    const result = Array<number>();
    this.zonas.forEach((z) => {
      const filtered = anomalias.filter((item) => item.globalCoords[1] == z);
      result.push(Math.round(filtered.length));
    });
    return result;
  }

  private _initChart(): void {
    this.chartOptions = {
      series: [
        {
          name: 'CC por Zonas 2019',
          data: this.chartData[0],
        },
        {
          name: 'CC por Zonas 2020',
          data: this.chartData[1],
        },
      ],
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
      title: {
        // text: 'MAE por zonas',
        // align: 'left',
      },
      xaxis: {
        categories: this.zonas,
        title: {
          text: 'Pasillos',
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
        labels: {
          minWidth: 100,
        },
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
