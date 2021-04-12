import { Component, OnInit, ViewChild } from '@angular/core';

import { GLOBAL } from '@core/services/global';

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

  constructor() {}

  ngOnInit(): void {
    this.chartOptionsMAE = {
      series: [
        {
          name: 'MAE %',
          data: [0.04, 0.4],
          color: GLOBAL.colores_mae[0],
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
      colors: ['#77B6EA', '#999999'],
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
        categories: ['Jul 2019', 'Jun 2020'],
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
        max: 2,
      },
      legend: {
        show: false,
      },
      annotations: {
        yaxis: [
          {
            y: 1.3,
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
            y: 1.3 + 0.5,
            y2: 1.3 - 0.5,
            borderColor: '#000',
            fillColor: '#FEB019',
            label: {
              text: 'desviación std.',
            },
          },
        ],
      },
    };
  }
}
