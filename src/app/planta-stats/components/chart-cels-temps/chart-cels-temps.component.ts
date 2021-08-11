import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { switchMap } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

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

import { GLOBAL } from '@core/services/global';
import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';

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
  colors: string[];
};

@Component({
  selector: 'app-chart-cels-temps',
  templateUrl: './chart-cels-temps.component.html',
  styleUrls: ['./chart-cels-temps.component.css'],
})
export class ChartCelsTempsComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  dataLoaded = false;
  informesIdList: string[];
  allAnomalias: Anomalia[];
  dateLabels: string[];

  private subscriptions: Subscription = new Subscription();

  constructor(private reportControlService: ReportControlService, private informeService: InformeService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([this.reportControlService.allFilterableElements$, this.reportControlService.informesIdList$])
        .pipe(
          switchMap(([elems, informesId]) => {
            this.allAnomalias = elems as Anomalia[];
            this.informesIdList = informesId;

            return this.informeService.getDateLabelsInformes(this.informesIdList);
          })
        )
        .subscribe((dateLabels) => {
          this.dateLabels = dateLabels;

          const data = [];

          this.informesIdList.forEach((informeId) => {
            const celsCals = this.allAnomalias
              .filter((anom) => anom.informeId === informeId)
              // tslint:disable-next-line: triple-equals
              .filter((anom) => anom.tipo == 8 || anom.tipo == 9);

            const range1 = celsCals.filter((cc) => cc.gradienteNormalizado < 10 && cc.gradienteNormalizado >= 0);
            const range2 = celsCals.filter((cc) => cc.gradienteNormalizado < 20 && cc.gradienteNormalizado >= 10);
            const range3 = celsCals.filter((cc) => cc.gradienteNormalizado < 30 && cc.gradienteNormalizado >= 20);
            const range4 = celsCals.filter((cc) => cc.gradienteNormalizado >= 40);

            data.push([range1.length, range2.length, range3.length, range4.length]);
          });

          this._initChartData(data);
        })
    );
  }

  private _initChartData(data: any[]): void {
    const series = this.dateLabels.map((dateLabel, index) => {
      return { name: dateLabel, data: data[index] };
    });

    this.chartOptions = {
      series,
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
          text: '# CC',
        },
        labels: {
          minWidth: 10,
          formatter: (value) => {
            return Math.round(value).toString();
          },
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
