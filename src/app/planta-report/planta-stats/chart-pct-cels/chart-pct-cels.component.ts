import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnomaliaService } from '@core/services/anomalia.service';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexYAxis,
  ApexLegend,
  ApexFill,
} from 'ng-apexcharts';
import { take } from 'rxjs/operators';
import { Anomalia } from '../../../core/models/anomalia';
import { GLOBAL } from '../../../core/services/global';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
};
@Component({
  selector: 'app-chart-pct-cels',
  templateUrl: './chart-pct-cels.component.html',
  styleUrls: ['./chart-pct-cels.component.css'],
})
export class ChartPctCelsComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  public plantaId: string;
  informesList: string[];
  allAnomalias: Anomalia[];
  dataLoaded = false;

  constructor(private route: ActivatedRoute, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];

    this.anomaliaService
      .getAnomaliasPlanta$(this.plantaId)
      .pipe(take(1))
      .subscribe((anomalias) => {
        this.allAnomalias = anomalias;
        const data = [];
        this.informesList.forEach((informeId) => {
          const filtered = anomalias.filter((anom) => {
            return anom.informeId == informeId && (anom.tipo == 8 || anom.tipo == 9);
          });
          data.push(Math.round((10000 * filtered.length) / 5508) / 100);
        });

        this._iniitChartData(data);
      });
  }

  private _iniitChartData(data): void {
    this.chartOptions = {
      series: [
        {
          name: 'Central',
          data: data,
        },
      ],
      chart: {
        type: 'area',
        height: 350,
        stacked: false,
        events: {
          selection: function (chart, e) {
            console.log(new Date(e.xaxis.min));
          },
        },
      },
      colors: [GLOBAL.gris],
      dataLabels: {
        enabled: false,
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.8,
        },
      },
      legend: {
        show: false,
        position: 'top',
        horizontalAlign: 'left',
      },
      xaxis: {
        type: 'category',
        categories: ['Jul 2019', 'Jun 2020'],
      },
      yaxis: {
        min: 0,
        max: 5,
      },
    };
    this.dataLoaded = true;
  }
}
