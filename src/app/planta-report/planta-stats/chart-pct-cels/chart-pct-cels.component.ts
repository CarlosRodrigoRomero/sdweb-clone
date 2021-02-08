import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnomaliaService } from '@core/services/anomalia.service';

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
import { take } from 'rxjs/operators';
import { Anomalia } from '../../../core/models/anomalia';

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
  public plantaId: string;
  informesList: string[];
  allAnomalias: Anomalia[];
  dataLoaded = false;

  constructor(private route: ActivatedRoute, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];

    this.anomaliaService
      .getAnomaliasPlanta$(this.plantaId)
      .pipe(take(1))
      .subscribe((anomalias) => {
        this.allAnomalias = anomalias;
        const data = [];
        this.informesList.forEach((informeId) => {
          const filtered = anomalias.filter((anom) => {
            return anom.informeId == informeId && (anom.tipo == 8 || anom.tipo == 9);
          });
          data.push(Math.round((10000 * filtered.length) / 5508) / 100);
        });

        this._iniitChartData(data);
      });
  }

  private _iniitChartData(data): void {
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
        height: 160,
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
          data: [15.4, 20],
        },
      ],
      chart: {
        id: 'tw',
        group: 'social',
        type: 'area',
        width: '100%',
        height: 160,
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
