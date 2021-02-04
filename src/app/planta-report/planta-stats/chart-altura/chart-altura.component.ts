import { Component, ViewChild } from '@angular/core';

import { ApexAxisChartSeries, ApexTitleSubtitle, ApexDataLabels, ApexChart, ChartComponent } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
  colors: any;
};
@Component({
  selector: 'app-chart-altura',
  templateUrl: './chart-altura.component.html',
  styleUrls: ['./chart-altura.component.css'],
})
export class ChartAlturaComponent {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'A',
          data: this.generateData(20, {
            min: 0,
            max: 90,
          }),
        },
        {
          name: 'B',
          data: this.generateData(20, {
            min: 0,
            max: 90,
          }),
        },
        {
          name: 'C',
          data: this.generateData(20, {
            min: 0,
            max: 90,
          }),
        },
        {
          name: 'D',
          data: this.generateData(20, {
            min: 0,
            max: 90,
          }),
        },
        {
          name: 'E',
          data: this.generateData(20, {
            min: 0,
            max: 90,
          }),
        },
        {
          name: 'F',
          data: this.generateData(20, {
            min: 0,
            max: 90,
          }),
        },
      ],
      chart: {
        height: 350,
        type: 'heatmap',
      },
      dataLabels: {
        enabled: false,
      },
      colors: ['#FB0000'],
      title: {
        text: '# anomalías por posición',
      },
    };
  }

  public generateData(count, yrange) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = 'C' + (i + 1).toString();
      var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push({
        x: x,
        y: y,
      });
      i++;
    }
    return series;
  }
}
