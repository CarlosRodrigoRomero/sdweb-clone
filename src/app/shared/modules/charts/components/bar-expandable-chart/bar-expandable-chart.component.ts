import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

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
  ApexAnnotations,
  ApexTooltip,
  ApexGrid,
} from 'ng-apexcharts';

export interface ChartOptions {
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
  annotations: ApexAnnotations;
  grid: ApexGrid;
  colors: string[];
}

@Component({
  selector: 'app-bar-expandable-chart',
  templateUrl: './bar-expandable-chart.component.html',
  styleUrls: ['./bar-expandable-chart.component.css'],
  providers: [DecimalPipe],
})
export class BarExpandableChartComponent implements OnInit {
  @ViewChild('chart', { static: false }) chart: ChartComponent;

  @Input() data: number[];
  @Input() dataName: string;
  @Input() dataAverage: number;
  @Input() labels: string[];
  @Input() amplitude: number;
  @Input() colors: string[];
  @Input() zoomed: boolean;

  @Output() elemSelected = new EventEmitter();
  @Output() elemHovered = new EventEmitter();

  public chartOptions: Partial<ChartOptions>;
  public dataLoaded = false;
  private chartPosition = 0;
  public chartStart = true;
  public chartEnd = false;
  private endChart: number;

  constructor(private decimalPipe: DecimalPipe) {}

  ngOnInit(): void {
    this.endChart = this.amplitude;

    this.initChart();
  }

  initChart() {
    let series: ApexAxisChartSeries;
    let xaxis: ApexXAxis;
    if (this.data.length > this.amplitude) {
      // empezamos con el gráfico ampliado
      series = [
        {
          name: this.dataName,
          data: this.data.filter((_, index) => index < this.amplitude),
        },
      ];
      xaxis = {
        categories: this.labels.filter((_, index) => index < this.amplitude),
        labels: {
          trim: true,
          maxHeight: 80,
        },
      };
    } else {
      series = [
        {
          name: this.dataName,
          data: this.data,
        },
      ];
      xaxis = {
        categories: this.labels,
        labels: {
          trim: true,
          maxHeight: 80,
        },
      };
    }

    this.chartOptions = {
      series,
      chart: {
        type: 'bar',
        height: '100%',
        events: {
          click: (event, chartContext, config) => {
            const index = config.dataPointIndex;
            this.sendElemSelected(index);
          },
          mouseMove: (event, chartContext, config) => {
            const index = config.dataPointIndex;
            this.sendElemHovered(index);
          },
        },
      },
      grid: {},
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
          distributed: true,
        },
      },
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
        formatter: (value) => Math.round(value * 100) / 100 + '%',
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis,
      yaxis: {
        min: 0,
        max:
          Math.max(...[...this.data, this.dataAverage * 100]) * 1.1 <
          Math.max(...[...this.data, this.dataAverage * 100]) + 0.1
            ? Math.max(...[...this.data, this.dataAverage * 100]) * 1.1
            : Math.max(...[...this.data, this.dataAverage * 100]) + 0.1,
        labels: {
          formatter: (value) => {
            return Math.round(value * 10) / 10 + '%';
          },
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (value) => {
            return Math.round(value * 100) / 100 + ' %';
          },
        },
      },
      colors: this.colors,
      annotations: {
        yaxis: [
          {
            y: this.dataAverage * 100,
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
              text: 'Media MAE Portfolio ' + this.decimalPipe.transform(this.dataAverage * 100, '1.0-2') + '%',
            },
          },
        ],
      },
    };

    this.dataLoaded = true;
  }

  private sendElemSelected(index: number) {
    this.elemSelected.emit(index);
  }

  private sendElemHovered(index: number) {
    this.elemHovered.emit(index);
  }

  public updateOptions(value: string): void {
    let dataFiltered;
    let labelsFiltered;
    let colorsFiltered;

    switch (value) {
      case 'all':
        this.zoomed = false;
        dataFiltered = this.data;
        labelsFiltered = this.labels;
        colorsFiltered = this.colors;
        break;
      case 'start':
        this.zoomed = true;
        this.chartPosition = 0;
        dataFiltered = this.data.filter((_, index) => index < 50);
        labelsFiltered = this.labels.filter((_, index) => index < 50);
        colorsFiltered = this.colors.filter((_, index) => index < 50);
        break;
      case 'left':
        this.chartEnd = false;
        this.chartPosition -= 50;
        this.endChart = this.chartPosition + 50;
        if (this.chartPosition === 0) {
          this.chartStart = true;
          this.endChart = 50;
        }
        dataFiltered = this.data.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        labelsFiltered = this.labels.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        colorsFiltered = this.colors.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        break;
      case 'right':
        this.chartStart = false;
        this.chartPosition += 50;
        this.endChart = this.chartPosition + 50;
        if (this.data.length - this.chartPosition < 50) {
          this.chartEnd = true;
          this.endChart = this.data.length;
        }
        dataFiltered = this.data.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        labelsFiltered = this.labels.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        colorsFiltered = this.colors.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        break;
    }

    this.chartOptions.series = [
      {
        name: this.dataName,
        data: dataFiltered,
      },
    ];
    this.chartOptions.xaxis = {
      categories: labelsFiltered,
      labels: {
        trim: true,
        maxHeight: 80,
      },
    };
    this.chartOptions.yaxis = {
      min: 0,
      max:
        Math.max(...[...dataFiltered, this.dataAverage * 100]) * 1.1 <
        Math.max(...[...dataFiltered, this.dataAverage * 100]) + 0.1
          ? Math.max(...[...dataFiltered, this.dataAverage * 100]) * 1.1
          : Math.max(...[...dataFiltered, this.dataAverage * 100]) + 0.1,
      labels: {
        formatter: (value) => {
          return Math.round(value * 10) / 10 + '%';
        },
      },
    };
    this.chartOptions.colors = colorsFiltered;
  }
}
