import { Component, OnInit } from '@angular/core';

import { combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';

import { Anomalia } from '@core/models/anomalia';

import {
  ApexAxisChartSeries,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip,
  ApexStroke,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: any; //ApexChart;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  title: ApexTitleSubtitle;
  fill: ApexFill;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  grid: any; //ApexGrid;
  colors: any;
  toolbar: any;
  annotations: any;
};

@Component({
  selector: 'app-chart-pct-cels',
  templateUrl: './chart-pct-cels.component.html',
  styleUrls: ['./chart-pct-cels.component.css'],
})
export class ChartPctCelsComponent implements OnInit {
  public chart1options: Partial<ChartOptions>;
  public chart2options: Partial<ChartOptions>;
  public chart3options: Partial<ChartOptions>;
  public commonOptions: Partial<ChartOptions> = {
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'straight',
    },

    markers: {
      size: 6,
      hover: {
        size: 10,
      },
    },
    tooltip: {
      followCursor: false,
      theme: 'dark',
      x: {
        show: false,
      },
      marker: {
        show: false,
      },
      y: {
        title: {
          formatter: function () {
            return '';
          },
        },
      },
    },
    grid: {
      clipMarkers: false,
    },
    xaxis: {
      type: 'category',
      categories: ['Jul 2019', 'Jun 2020'],
    },
  };
  informesIdList: string[];
  allAnomalias: Anomalia[];
  dataLoaded = false;
  chartHeight = 150;

  constructor(private reportControlService: ReportControlService, private informeService: InformeService) {}

  ngOnInit(): void {
    combineLatest([this.reportControlService.allFilterableElements$, this.reportControlService.informesIdList$])
      .pipe(
        switchMap(([elems, informesId]) => {
          this.allAnomalias = elems as Anomalia[];
          this.informesIdList = informesId;

          return this.informeService.getDateLabelsInformes(this.informesIdList);
        })
      )
      .subscribe((dateLabels) => {
        this.commonOptions.xaxis.categories = dateLabels;

        const data = [];
        this.informesIdList.forEach((informeId) => {
          const filtered = this.allAnomalias.filter((anom) => {
            return anom.informeId == informeId && (anom.tipo == 8 || anom.tipo == 9);
          });
          data.push(Math.round((10000 * filtered.length) / 5508) / 100);
        });

        this._initChartData(data);
      });
  }

  private _initChartData(data): void {
    this.chart1options = {
      series: [
        {
          name: '% celulas calientes',
          data,
        },
      ],
      chart: {
        id: 'fb',
        group: 'social',
        type: 'area',
        width: '100%',
        height: this.chartHeight,
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
      title: {},
      colors: ['#008FFB'],
      yaxis: {
        min: 0,
        max: 5,
        tickAmount: 2,
        labels: {
          minWidth: 40,
          formatter: (value) => {
            return value + '%';
          },
        },
      },

      tooltip: {
        followCursor: false,
        theme: 'dark',
        x: {
          show: false,
        },
        marker: {
          show: false,
        },
        y: {
          title: {
            formatter: (s) => {
              return ':' + s;
            },
          },
        },
      },
      annotations: {
        yaxis: [
          {
            y: 1.8,
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
              text: '% Céls. medio portfolio',
            },
          },
        ],
      },
    };

    this.chart2options = {
      series: [
        {
          name: 'gradiente medio',
          data: [15.4, 15.9],
        },
      ],
      chart: {
        id: 'tw',
        group: 'social',
        type: 'area',
        width: '100%',
        height: this.chartHeight,
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
      colors: ['#546E7A'],
      yaxis: {
        min: 0,
        max: 40,
        tickAmount: 2,
        labels: {
          minWidth: 40,
          formatter: (value) => {
            return value + ' ºC';
          },
        },
      },
      tooltip: {
        followCursor: false,
        theme: 'dark',
        x: {
          show: false,
        },
        marker: {
          show: false,
        },
        y: {
          title: {
            formatter: (s) => {
              return ': ' + s;
            },
          },
        },
      },
      annotations: {
        yaxis: [
          {
            y: 12.1,
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
              text: 'DT medio portfolio (ºC)',
            },
          },
        ],
      },
    };

    this.dataLoaded = true;
  }
}
