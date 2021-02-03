import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartDataSets, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
import { GLOBAL } from '@core/services/global';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';
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
  private maeMedio: number;
  private maeSigma: number;
  public dataLoaded = false;

  constructor(private plantaService: PlantaService, public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => {
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => {
        plantas.forEach((planta) => {
          if (planta.informes !== undefined && planta.informes.length > 0) {
            const mae = planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae;
            if (mae !== undefined) {
              this.data.push(Math.round(10 * mae) / 10);
              this.barChartLabels.push(planta.nombre);
            }
          }
        });
        this.maeMedio = this.average(this.data);

        this.maeSigma = this.standardDeviation(this.data);

        this.data.forEach((m) => {
          this.coloresChart.push(this.getColorMae(m));
        });

        this.initChart();
      });
    });
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
        height: 280,
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
        /* labels: {
          rotate: -30,
        }, */
        categories: this.barChartLabels,
        /* tickPlacement: 'on', */
      },
      /* yaxis: {
        title: {
          text: 'MAE',
        },
      }, */
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
}
