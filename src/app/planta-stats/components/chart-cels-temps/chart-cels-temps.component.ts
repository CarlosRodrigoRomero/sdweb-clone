import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

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
} from 'ng-apexcharts';

import { PcService } from '@core/services/pc.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { GLOBAL } from '@core/services/global';

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
  colors: string[];
};

@Component({
  selector: 'app-chart-cels-temps',
  templateUrl: './chart-cels-temps.component.html',
  styleUrls: ['./chart-cels-temps.component.css'],
})
export class ChartCelsTempsComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  dataLoaded = false;
  plantaId: any;
  informesList: string[];
  allAnomalias: any;

  constructor(private route: ActivatedRoute, private pcService: PcService, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.informesList = ['519Z4dQF4gfUPwbbHqxw', '62dvYbGgoMkMNCuNCOEc'];

    const anom1 = this.pcService.getPcsSinFiltros(this.informesList[0]);
    const anom2 = this.pcService.getPcsSinFiltros(this.informesList[1]);

    combineLatest([anom1, anom2])
      .pipe(take(1))
      .subscribe((list) => {
        const data = [];
        const dataGrads = [];

        list.forEach((pcs) => {
          pcs = pcs.filter((pc) => pc.tipo == 8 || pc.tipo == 9);
          const l1 = pcs.filter((pc) => pc.gradienteNormalizado < 10 && pc.gradienteNormalizado >= 0);
          const l2 = pcs.filter((pc) => pc.gradienteNormalizado < 20 && pc.gradienteNormalizado >= 10);
          const l3 = pcs.filter((pc) => pc.gradienteNormalizado < 30 && pc.gradienteNormalizado >= 20);
          const l4 = pcs.filter((pc) => pc.gradienteNormalizado >= 40);
          data.push([
            Math.round(l1.length / 10),
            Math.round(l2.length / 10),
            Math.round(l3.length / 10),
            Math.round(l4.length / 10),
          ]);
          let sum = 0;
          let res = 0;
          // pcs.forEach((pc) => {
          //   if (!isNaN(pc.gradienteNormalizado)) {
          //     sum += pc.gradienteNormalizado; //don't forget to add the base
          //   } else {
          //     res += 1;
          //   }
          // });
          // dataGrads.push(Math.round((sum / (pcs.length - res)) * 10) / 10);
        });
        this._initChartData(data);
        // console.log('dataGrad', dataGrads);
      });
  }

  private _initChartData(data): void {
    this.chartOptions = {
      series: [
        {
          name: 'Jul 2019',
          data: data[0],
        },
        {
          name: 'Jun 2020',
          data: data[1],
        },
      ],
      chart: {
        type: 'bar',
        height: 250,
      },
      legend: { show: false },
      colors: [GLOBAL.gris, GLOBAL.gris],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
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
        categories: ['0-10 ºC', '20-30 ºC', '30-40 ºC', '>40 ºC'],
      },
      yaxis: {
        title: {
          text: '| Anomalias',
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (val) => {
            return val + '';
          },
        },
      },
    };
    this.dataLoaded = true;
  }
}
