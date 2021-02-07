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
          data: this.generateData(1, {
            min: 0,
            max: 50,
          }),
        },
        {
          name: 'B',
          data: this.generateData(1, {
            min: 0,
            max: 50,
          }),
        },
        {
          name: 'C',
          data: this.generateData(1, {
            min: 0,
            max: 50,
          }),
        },
        {
          name: 'D',
          data: this.generateData(1, {
            min: 0,
            max: 50,
          }),
        },
        {
          name: 'E',
          data: this.generateData(1, {
            min: 0,
            max: 50,
          }),
        },
        {
          name: 'F',
          data: this.generateData(1, {
            min: 0,
            max: 50,
          }),
        },
      ],
      chart: {
        height: 250,
        width: 250,
        type: 'heatmap',
      },
      dataLabels: {
        enabled: false,
      },
      colors: ['#FB0000'],
      title: {
        text: '# anomalías por altura',
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
