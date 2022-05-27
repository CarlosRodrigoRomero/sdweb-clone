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

import { GLOBAL } from '@data/constants/global';
import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';
import { AnomaliaService } from '@data/services/anomalia.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

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
  allAnomalias: Anomalia[] = [];
  dateLabels: string[];
  private gradienteMinimoCriterio = 0;
  private categories: string[];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.informesIdList = this.reportControlService.informesIdList;

    this.allAnomalias = this.reportControlService.allAnomalias;

    this.subscriptions.add(
      this.informeService.getDateLabelsInformes(this.informesIdList).subscribe((dateLabels) => {
        this.dateLabels = dateLabels;

        const data = [];

        this.informesIdList.forEach((informeId) => {
          const celsCals = this.allAnomalias
            .filter((anom) => anom.informeId === informeId)
            // tslint:disable-next-line: triple-equals
            .filter((anom) => anom.tipo == 8 || anom.tipo == 9);

          this.gradienteMinimoCriterio = this.anomaliaService.criterioCriticidad.rangosDT[0];

          if (this.gradienteMinimoCriterio < 10) {
            const range1 = celsCals.filter((cc) => cc.gradienteNormalizado < 10 && cc.gradienteNormalizado >= 0);
            const range2 = celsCals.filter((cc) => cc.gradienteNormalizado < 20 && cc.gradienteNormalizado >= 10);
            const range3 = celsCals.filter((cc) => cc.gradienteNormalizado < 30 && cc.gradienteNormalizado >= 20);
            const range4 = celsCals.filter((cc) => cc.gradienteNormalizado < 40 && cc.gradienteNormalizado >= 30);
            const range5 = celsCals.filter((cc) => cc.gradienteNormalizado >= 40);

            this.categories = [
              this.gradienteMinimoCriterio.toString() + '-10 ºC',
              '10-20 ºC',
              '20-30 ºC',
              '30-40 ºC',
              '>40 ºC',
            ];

            data.push([range1.length, range2.length, range3.length, range4.length, range5.length]);
          } else {
            const range1 = celsCals.filter((cc) => cc.gradienteNormalizado < 20 && cc.gradienteNormalizado >= 10);
            const range2 = celsCals.filter((cc) => cc.gradienteNormalizado < 30 && cc.gradienteNormalizado >= 20);
            const range3 = celsCals.filter((cc) => cc.gradienteNormalizado < 40 && cc.gradienteNormalizado >= 30);
            const range4 = celsCals.filter((cc) => cc.gradienteNormalizado >= 40);

            this.categories = ['10-20 ºC', '20-30 ºC', '30-40 ºC', '>40 ºC'];

            data.push([range1.length, range2.length, range3.length, range4.length]);
          }
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
        categories: this.categories,
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
