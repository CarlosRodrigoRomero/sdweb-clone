import { Component, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexYAxis,
  ApexLegend,
  ApexMarkers,
} from 'ng-apexcharts';

import { GLOBAL } from '@data/constants/global';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  colors: string[];
  legend: ApexLegend;
  markers: ApexMarkers;
};
@Component({
  selector: 'app-prediccion-maes',
  templateUrl: './prediccion-maes.component.html',
  styleUrls: ['./prediccion-maes.component.css'],
  providers: [DecimalPipe],
})
export class PrediccionMaesComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  chartOptions: Partial<ChartOptions>;
  private series: ApexAxisChartSeries = [];
  private plantas: string[];
  dataMae: number[] = [];
  dataVarMae: number[] = [];
  dataLoaded = false;

  constructor(private decimalPipe: DecimalPipe) {}

  ngOnInit(): void {
    this.plantas = ['Planta 3', 'Planta 8', 'Planta 11'];

    const dataVarMae = [
      // [0.04, 0.4, 0.76, 1.01, 1.32, 1.71, 2.22, 2.91 /* , 3.88, 5.27, 7.29 */], // Demo
      // [0.86, 1.22, 1.64, 2.18, 2.88, 3.83, 5.17, 7.11 /* , 9.98, 14.26, 20.74 */], // Planta 1
      // [1.3, 1.87, 2.59, 3.51, 4.77, 6.53, 9.1, 12.93 /* , 18.78, 27.83, 41.97 */], // Planta 2
      [null, 1.01, 1.54, 2.56, 3.85, 5.52, 7.9, 11.07 /* , 13.92, 19.62, 28.18 */], // Planta 3 -
      // [0.5, 0.76, 1.06, 1.43, 1.92, 2.57, 3.48, 4.78 /* , 6.68, 9.52, 13.8 */], // Planta 4
      // [0.94, 1.33, 1.85, 2.56, 3.59, 5.13, 7.53, 11.33 /* , 17.46, 27.46, 43.9 */], // Planta 5
      // [1.3, 1.88, 2.62, 3.63, 5.06, 7.18, 10.41, 15.48 /* , 23.58, 36.66, 57.99 */], // Planta 6
      // [0.36, 0.54, 0.76, 1.04, 1.42, 1.97, 2.78, 4.01 /* , 5.93, 8.96, 13.78 */], // Planta 7
      [null, 1.28, 1.41, 1.62, 1.83, 2.33, 2.91, 3.62 /* , 4.52, 5.69, 7.3 */], // Planta 8
      // [0.86, 1.31, 1.83, 2.43, 3.16, 4.08, 5.29, 6.93 /* , 9.19, 12.4, 17.02 */], // Planta 9
      // [0.07, 0.23, 0.41, 0.59, 0.8, 1.04, 1.35, 1.74 /* , 2.3, 3.12, 4.35 */], // Planta 10
      [null, 1.38, 1.85, 2.48, 3.33, 4.54, 6.31, 8.95 /* , 12.94, 19.07, 28.54 */], // Planta 11 -
      // [0.72, 1.15, 1.64, 2.23, 2.96, 3.93, 5.26, 7.15 /* , 9.93, 14.09, 20.42 */], // Planta 12
    ];

    const dataMae = [
      [0.62, 1.01],
      [1.22, 1.28],
      [1.01, 1.38],
    ];

    this.plantas.forEach((planta, index) => {
      this.series.push({ name: planta, data: dataMae[index] });
      this.series.push({ name: planta, data: dataVarMae[index] });
    });

    this.initChart();
  }

  initChart() {
    this.chartOptions = {
      series: this.series,
      chart: {
        height: 600,
        type: 'line',
        toolbar: {
          show: true,
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
      stroke: {
        width: 3,
        // curve: 'smooth',
        dashArray: [0, 10, 0, 10, 0, 10],
      },
      xaxis: {
        categories: ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027'],
      },
      yaxis: {
        title: {
          text: 'MAE',
          style: {
            fontFamily: 'Roboto',
            fontSize: '14px',
            fontWeight: 500,
          },
        },
        labels: {
          formatter: (value) => {
            return this.decimalPipe.transform(value, '1.0-2') + '%';
          },
        },
      },
      colors: [
        GLOBAL.colores_new_mae[2],
        GLOBAL.colores_new_mae[2],
        GLOBAL.colores_new_mae[0],
        GLOBAL.colores_new_mae[0],
        GLOBAL.colores_new_mae[1],
        GLOBAL.colores_new_mae[1],
      ],
      legend: {
        show: false,
      },
      markers: {
        discrete: [
          {
            seriesIndex: 0,
            dataPointIndex: 0,
            fillColor: GLOBAL.colores_new_mae[2],
            strokeColor: '#fff',
            size: 7,
          },
          {
            seriesIndex: 0,
            dataPointIndex: 1,
            fillColor: GLOBAL.colores_new_mae[2],
            strokeColor: '#fff',
            size: 7,
          },
          {
            seriesIndex: 2,
            dataPointIndex: 0,
            fillColor: GLOBAL.colores_new_mae[0],
            strokeColor: '#fff',
            size: 7,
          },
          {
            seriesIndex: 2,
            dataPointIndex: 1,
            fillColor: GLOBAL.colores_new_mae[0],
            strokeColor: '#fff',
            size: 7,
          },
          {
            seriesIndex: 4,
            dataPointIndex: 0,
            fillColor: GLOBAL.colores_new_mae[1],
            strokeColor: '#fff',
            size: 7,
          },
          {
            seriesIndex: 4,
            dataPointIndex: 1,
            fillColor: GLOBAL.colores_new_mae[1],
            strokeColor: '#fff',
            size: 7,
          },
        ],
        shape: 'circle',
        size: 1,
      },
    };

    this.dataLoaded = true;
  }
}
