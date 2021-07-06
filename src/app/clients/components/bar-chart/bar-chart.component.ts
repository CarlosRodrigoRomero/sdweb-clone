import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { GLOBAL } from '@core/services/global';
import { AuthService } from '@core/services/auth.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

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
} from 'ng-apexcharts';
import { PlantaInterface } from '@core/models/planta';

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
  colors: string[];
}
@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css'],
})
export class BarChartComponent implements OnInit {
  public barChartLabels = Array<string>();
  public data = Array<number>();
  public coloresChart = Array<string>();
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  private maePlantas: number[] = [];
  private maeMedio: number;
  private maeSigma: number;
  public dataLoaded = false;
  public plantasId: string[] = [];
  public tiposPlantas: string[] = [];
  private plantas: PlantaInterface[];

  constructor(
    public auth: AuthService,
    private portfolioControlService: PortfolioControlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.maePlantas = this.portfolioControlService.maePlantas;
    this.maeMedio = this.portfolioControlService.maeMedio;
    this.maeSigma = this.portfolioControlService.maeSigma;

    this.plantas.forEach((planta, index) => {
      const mae = this.maePlantas[index];
      if (mae !== undefined) {
        this.data.push(Math.round(10 * mae) / 10);
        // añadimos al array de ids
        this.plantasId.push(planta.id);
        // añadimos al array de tipos
        this.tiposPlantas.push(planta.tipo);

        this.barChartLabels.push(planta.nombre);
      }
    });

    this.data.forEach((m) => {
      this.coloresChart.push(this.getColorMae(m));
    });

    this.initChart();
  }

  private getColorMae(mae: number): string {
    if (mae >= this.maeMedio + this.maeSigma) {
      return GLOBAL.colores_mae[2];
    } else if (mae <= this.maeMedio - this.maeSigma) {
      return GLOBAL.colores_mae[0];
    } else {
      return GLOBAL.colores_mae[1];
    }
  }

  initChart() {
    this.chartOptions = {
      series: [
        {
          name: 'MAE Planta',
          data: this.data,
        },
      ],
      chart: {
        type: 'bar',
        height: '100%',
        events: {
          click: (event, chartContext, config) => {
            const index = config.dataPointIndex;
            this.onClick(index);
          },
        },
      },
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
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: this.barChartLabels,
        labels: {
          trim: true,
          maxHeight: 80,
        },
      },
      yaxis: {
        min: this.maeMedio - this.maeSigma - 0.5 > 0 ? this.maeMedio - this.maeSigma - 0.5 : 0,
        max: this.maeMedio + this.maeSigma + 0.5,
        // max: Math.max(...[...this.data, this.maeMedio]) + 0.5,
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (val) => {
            return +val + ' %';
          },
        },
      },
      colors: this.coloresChart,
      annotations: {
        yaxis: [
          {
            y: this.maeMedio,
            borderColor: '#77b6ea',
            borderWidth: 2,
            strokeDashArray: 10,

            label: {
              offsetX: -100,
              borderColor: '#77b6ea',
              style: {
                fontSize: '12px',
                color: '#fff',
                background: '#77b6ea',
              },
              text: 'Media MAE Portfolio',
            },
          },
          {
            y: this.maeMedio + this.maeSigma,
            y2: this.maeMedio - this.maeSigma,
            borderColor: '#000',
            fillColor: '#FEB019',
            label: {
              text: 'desviación std.',
            },
          },
        ],
      },
    };

    this.dataLoaded = true;
  }

  private standardDeviation(values) {
    const avg = this.average(values);

    const squareDiffs = values.map((value) => {
      const diff = value - avg;
      const sqrDiff = diff * diff;
      return sqrDiff;
    });

    const avgSquareDiff = this.average(squareDiffs);

    const stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
  }

  private average(data) {
    const sum = data.reduce(function (sum, value) {
      return sum + value;
    }, 0);

    const avg = sum / data.length;
    return avg;
  }

  private onClick(index: number) {
    const plantaId = this.plantasId[index];
    const tipoPlanta = this.tiposPlantas[index];

    if (tipoPlanta === 'seguidores') {
      this.router.navigate(['clients/tracker/' + plantaId]);
    } else {
      this.router.navigate(['clients/fixed/' + plantaId]);
    }
  }
}
