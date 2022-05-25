import { Component, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { switchMap, take } from 'rxjs/operators';

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
import { AuthService } from '@data/services/auth.service';

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
  providers: [DecimalPipe],
})
export class ChartMaeGlobalComponent implements OnInit {
  @ViewChild('chartMAE') chartMAE: ChartComponent;
  public chartOptionsMAE: Partial<ChartOptions>;
  loadChart = false;
  private maeData: number[] = [];
  private maeColors: string[] = [];
  private maeMedio: number;
  private maeSigma: number;

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private portfolioControlService: PortfolioControlService,
    private authService: AuthService,
    private decimalPipe: DecimalPipe
  ) {}

  ngOnInit(): void {
    this.authService.user$
      .pipe(
        take(1),
        switchMap((user) => this.portfolioControlService.getMaeMedioAndSigmaPortfolio(user)),
        take(1),
        switchMap(([maeMedio, maeSigma]) => {
          this.maeMedio = maeMedio * 100;
          this.maeSigma = maeSigma * 100;

          const informes = this.reportControlService.informes;

          this.maeData = informes.map((inf) => inf.mae * 100);

          if (this.maeMedio !== undefined && this.maeSigma !== undefined) {
            this.maeColors = this.maeData.map((mae) => {
              if (mae >= this.maeMedio + this.maeSigma) {
                return GLOBAL.colores_mae_rgb[2];
              } else if (mae <= this.maeMedio) {
                return GLOBAL.colores_mae_rgb[0];
              } else {
                return GLOBAL.colores_mae_rgb[1];
              }
            });
          }

          return this.informeService.getDateLabelsInformes(informes.map((inf) => inf.id));
        }),
        take(1)
      )
      .subscribe((dateLabels) => {
        // si solo hay un informe cambiamos a grafico tipo barra
        let typeChart: ChartType = 'line';
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
            formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + '%',
            style: {
              fontSize: '16px',
            },
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
            },
            labels: {
              formatter: (value) => {
                return this.decimalPipe.transform(value, '1.0-1');
              },
              minWidth: 10,
            },
            min: 0,
            max:
              Math.max(...[...this.maeData, this.maeMedio]) * 1.1 < Math.max(...[...this.maeData, this.maeMedio]) + 0.1
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
                  text: 'Media MAE Portfolio ' + this.decimalPipe.transform(this.maeMedio, '1.0-2') + '%',
                },
              },
            ],
          },
        };
        this.loadChart = true;
      });
  }
}
