import { Component, OnInit, ViewChild } from '@angular/core';

import { GLOBAL } from '@core/services/global';

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
} from 'ng-apexcharts';

import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';
import { StatsService } from '@core/services/stats.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { InformeInterface } from '@core/models/informe';
import { combineLatest } from 'rxjs';

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
export class ChartMaeGlobalComponent implements OnInit {
  @ViewChild('chartMAE') chartMAE: ChartComponent;
  public chartOptionsMAE: Partial<ChartOptions>;
  private informeList: InformeInterface[];
  loadChart = false;

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private statsService: StatsService,
    private portfolioControlService: PortfolioControlService
  ) {}

  ngOnInit(): void {
    const informesPlanta = this.informeService.getInformesDePlanta(this.reportControlService.plantaId);
    const getMaeMedio = this.portfolioControlService.maeMedio$;
    const getMaeSigma = this.portfolioControlService.maeSigma$;

    combineLatest([informesPlanta, getMaeMedio, getMaeSigma]).subscribe(([informes, maeMedio, maeSigma]) => {
      const maeData = informes.map((inf) => inf.mae);

      const maeColors = maeData.map((mae) => {
        if (mae < maeMedio - maeSigma) {
          return GLOBAL.colores_mae[0];
        } else if (mae <= maeMedio + maeSigma || mae >= maeMedio - maeSigma) {
          return GLOBAL.colores_mae[1];
        } else {
          return GLOBAL.colores_mae[2];
        }
      });

      this.informeService.getDateLabelsInformes(informes.map((inf) => inf.id)).subscribe((dateLabels) => {
        this.chartOptionsMAE = {
          series: [
            {
              name: 'MAE %',
              data: maeData,
            },
          ],
          chart: {
            height: 240,
            width: '100%',
            type: 'line',
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
          // colors: ['#77B6EA', '#999999'],
          colors: maeColors,
          dataLabels: {
            enabled: true,
          },
          stroke: {
            // curve: 'smooth',
          },
          // title: {
          //   text: 'Evolución MAE',
          //   align: 'left',
          // },
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
            // title: {
            //   text: 'Año',
            // },
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
            },
            min: 0,
            max: Math.max(...[...maeData, maeMedio]) + 0.5,
          },
          legend: {
            show: false,
          },
          annotations: {
            yaxis: [
              {
                y: maeMedio,
                borderColor: '#5b5b5c',
                borderWidth: 2,
                strokeDashArray: 10,

                label: {
                  offsetX: -100,
                  borderColor: '#5b5b5c',
                  style: {
                    fontSize: '12px',
                    color: '#fff',
                    background: '#5b5b5c',
                  },
                  text: 'Media MAE Portfolio',
                },
              },
              {
                y: maeMedio + maeSigma,
                y2: maeMedio - maeSigma,
                borderColor: '#000',
                fillColor: '#FEB019',
                label: {
                  text: 'desviación std.',
                },
              },
            ],
          },
        };
        this.loadChart = true;
      });
    });
  }
}
