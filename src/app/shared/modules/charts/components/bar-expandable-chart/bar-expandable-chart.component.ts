import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { take } from 'rxjs/operators';

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

import { TranslateService } from '@ngx-translate/core';

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
  @Input() units: string;
  @Input() titleY: string;
  @Input() textColor: string;
  @Input() theme: string;

  @Output() elemSelected = new EventEmitter();
  @Output() elemHovered = new EventEmitter();
  @Output() chartPositionChange = new EventEmitter();

  public chartOptions: Partial<ChartOptions>;
  public dataLoaded = false;
  private chartPosition = 0;
  public chartStart = true;
  public chartEnd = false;
  private endChart: number;
  private mediaLabel: string;

  constructor(private decimalPipe: DecimalPipe, private translate: TranslateService) {}

  ngOnInit(): void {
    this.endChart = this.amplitude;

    this.translate
      .get('Media MAE Portfolio')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.mediaLabel = res;
      });

    this.initChart();
  }

  initChart() {
    let series: ApexAxisChartSeries;
    let xaxis: ApexXAxis;
    let annotations: ApexAnnotations;
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
          style: {
            fontFamily: 'Roboto',
          },
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
          style: {
            fontFamily: 'Roboto',
          },
        },
      };
    }
    if (this.dataAverage !== undefined) {
      annotations = {
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
              text: this.mediaLabel + ' ' + this.decimalPipe.transform(this.dataAverage * 100, '1.0-2') + this.units,
            },
          },
        ],
      };
    }

    this.chartOptions = {
      series,
      chart: {
        type: 'bar',
        height: '100%',
        foreColor: this.textColor,
        toolbar: {
          show: false,
        },
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
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          // endingShape: 'rounded',
          distributed: true,
        },
      },
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
        formatter: (value) => value + this.units,
      },
      // stroke: {
      //   show: true,
      //   width: 2,
      //   colors: ['transparent'],
      // },
      xaxis,
      yaxis: {
        labels: {
          formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + this.units,
        },
        title: {
          text: this.titleY,
          style: {
            fontSize: '16px',
            fontFamily: 'Roboto',
            fontWeight: 500,
          },
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + this.units,
        },
        theme: this.theme,
      },
      colors: this.colors,
      annotations,
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
        this.chartPosition = 0;
        dataFiltered = this.data;
        labelsFiltered = this.labels;
        colorsFiltered = this.colors;
        break;
      case 'start':
        this.zoomed = true;
        this.chartStart = true;
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
      labels: {
        formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + this.units,
      },
    };
    this.chartOptions.colors = colorsFiltered;

    // enviamos el nuevo valor de inicio del gráfico
    this.chartPositionChange.emit(this.chartPosition);
  }
}
