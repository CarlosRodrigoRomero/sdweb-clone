import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend,
  ApexAnnotations,
  ApexTooltip,
  ChartType,
} from 'ng-apexcharts';

import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';
import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { GLOBAL } from '@data/constants/global';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
  annotations: ApexAnnotations;
  toolbar: any;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-chart-mae-global',
  templateUrl: './chart-mae-global.component.html',
  styleUrls: ['./chart-mae-global.component.css'],
})
export class ChartMaeGlobalComponent implements OnInit, OnDestroy {
  @ViewChild('chartMAE') chartMAE: ChartComponent;
  public chartOptionsMAE: Partial<ChartOptions>;
  loadChart = false;
  private maeData: number[] = [];
  private maeColors: string[] = [];
  private maeMedio: number;
  private maeSigma: number;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private portfolioControlService: PortfolioControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.informes$
        .pipe(
          take(1),
          switchMap((informes) => {
            this.maeData = informes.map((inf) => inf.mae * 100);
            this.maeMedio = this.portfolioControlService.maeMedio * 100;
            this.maeSigma = this.portfolioControlService.maeSigma * 100;

            if (this.maeMedio !== undefined && this.maeSigma !== undefined) {
              this.maeColors = this.maeData.map((mae) => {
                if (mae < this.maeMedio - this.maeSigma) {
                  return GLOBAL.colores_mae[0];
                } else if (mae <= this.maeMedio + this.maeSigma && mae >= this.maeMedio - this.maeSigma) {
                  return GLOBAL.colores_mae[1];
                } else {
                  return GLOBAL.colores_mae[2];
                }
              });
            }

            return this.informeService.getDateLabelsInformes(informes.map((inf) => inf.id));
          })
        )
        .subscribe((dateLabels) => {
          // si solo hay un informe cambiamos a grafico tipo barra
          let typeChart: ChartType = 'area';
          if (this.maeData.length === 1) {
            typeChart = 'bar';
          }

          this.chartOptionsMAE = {
            series: [
              {
                name: 'MAE %',
                data: this.maeData,
              },
            ],
            chart: {
              width: '100%',
              type: typeChart,
              height: 250,
              dropShadow: {
                enabled: true,
                color: '#000',
                top: 18,
                left: 7,
                blur: 10,
                opacity: 0.2,
              },
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
            colors: this.maeColors,
            dataLabels: {
              enabled: true,
              formatter: (value) => Math.round(value * 100) / 100 + '%',
            },
            grid: {
              borderColor: '#e7e7e7',
              row: {
                colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                opacity: 0.5,
              },
            },
            markers: {
              size: 1,
            },
            xaxis: {
              categories: dateLabels,
            },
            yaxis: {
              title: {
                text: 'MAE %',
                offsetY: 30,
              },
              labels: {
                formatter: (value) => {
                  return Math.round(value * 10) / 10 + '%';
                },
                minWidth: 10,
              },
              min: 0,
              max:
                Math.max(...[...this.maeData, this.maeMedio]) * 1.1 <
                Math.max(...[...this.maeData, this.maeMedio]) + 0.1
                  ? Math.max(...[...this.maeData, this.maeMedio]) * 1.1
                  : Math.max(...[...this.maeData, this.maeMedio]) + 0.1,
            },
            legend: {
              show: false,
            },
            annotations: {
              yaxis: [
                {
                  y: this.maeMedio,
                  borderColor: '#053e86',
                  borderWidth: 2,
                  strokeDashArray: 10,

                  label: {
                    offsetX: -100,
                    borderColor: '#053e86',
                    style: {
                      fontSize: '12px',
                      color: '#fff',
                      background: '#053e86',
                    },
                    text: 'Media MAE Portfolio',
                  },
                },
                {
                  y: this.maeMedio + this.maeSigma,
                  y2: this.maeMedio - this.maeSigma,
                  borderColor: '#000',
                  fillColor: '#2478ff',
                  label: {
                    text: 'desviación std.',
                  },
                },
              ],
            },
          };
          this.loadChart = true;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
