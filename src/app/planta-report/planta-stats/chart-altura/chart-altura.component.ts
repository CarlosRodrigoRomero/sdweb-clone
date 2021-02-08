import { Component, ViewChild } from '@angular/core';

import { ApexAxisChartSeries, ApexTitleSubtitle, ApexDataLabels, ApexChart, ChartComponent } from 'ng-apexcharts';
import { GLOBAL } from '../../../core/services/global';

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
          data: [
            { x: 'Jul 2019', y: 35 },
            { x: 'Jun 2020', y: 25 },
          ],
        },
        {
          name: 'B',
          data: [
            { x: 'Jul 2019', y: 20 },
            { x: 'Jun 2020', y: 17 },
          ],
        },
        {
          name: 'C',
          data: [
            { x: 'Jul 2019', y: 20 },
            { x: 'Jun 2020', y: 15 },
          ],
        },
        {
          name: 'D',
          data: [
            { x: 'Jul 2019', y: 15 },
            { x: 'Jun 2020', y: 25 },
          ],
        },
        {
          name: 'E',
          data: [
            { x: 'Jul 2019', y: 18 },
            { x: 'Jun 2020', y: 20 },
          ],
        },
        {
          name: 'F',
          data: [
            { x: 'Jul 2019', y: 36 },
            { x: 'Jun 2020', y: 18 },
          ],
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
      colors: [GLOBAL.gris],
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
