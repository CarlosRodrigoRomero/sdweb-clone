import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

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

import { GLOBAL } from '@core/services/global';
import { AuthService } from '@core/services/auth.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

interface PlantaChart {
  planta: PlantaInterface;
  informeReciente: InformeInterface;
  mae: number;
}

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
  private informes: InformeInterface[];
  private fechaInformesRecientes: number[] = [];
  private plantasChart: PlantaChart[] = [];

  constructor(
    public auth: AuthService,
    private portfolioControlService: PortfolioControlService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;
    this.maePlantas = this.portfolioControlService.maePlantas;
    this.maeMedio = this.portfolioControlService.maeMedio;
    this.maeSigma = this.portfolioControlService.maeSigma;

    this.plantas.forEach((planta, index) => {
      const mae = this.maePlantas[index];
      if (mae !== undefined) {
        // obtenemos el informe mas reciente de la planta para usar su fecha
        const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
        const informeReciente = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));

        this.plantasChart.push({ planta, informeReciente, mae });
      }
    });

    this.plantasChart.sort((a, b) => b.mae - a.mae);

    this.plantasChart.forEach((plant) => {
      this.data.push(plant.mae * 100);
      this.plantasId.push(plant.planta.id);
      this.tiposPlantas.push(plant.planta.tipo);
      this.fechaInformesRecientes.push(plant.informeReciente.fecha);
      this.coloresChart.push(this.getColorMae(plant.mae));
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
        formatter: (value) => Math.round(value * 100) / 100 + '%',
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
        min: 0,
        // min: this.maeMedio - this.maeSigma - 0.5 > 0 ? this.maeMedio - this.maeSigma - 0.5 : 0,
        // max: this.maeMedio + this.maeSigma + 0.5,
        max: Math.max(...[...this.data, this.maeMedio * 100]) + 0.5,
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
      colors: this.coloresChart,
      annotations: {
        yaxis: [
          {
            y: this.maeMedio * 100,
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
              text: 'Media MAE Portfolio',
            },
          },
          {
            y: (this.maeMedio + this.maeSigma) * 100,
            y2: (this.maeMedio - this.maeSigma) * 100,
            borderColor: '#000',
            fillColor: '#2478ff',
            label: {
              text: 'desviación media',
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
    if (index !== -1) {
      const plantaId = this.plantasId[index];
      const tipoPlanta = this.tiposPlantas[index];
      const fechaInformeReciente = this.fechaInformesRecientes[index];

      if (tipoPlanta === 'seguidores') {
        this.router.navigate(['clients/tracker/' + plantaId]);
      } else if (fechaInformeReciente > 1619820000 || plantaId === 'egF0cbpXnnBnjcrusoeR') {
        this.router.navigate(['clients/fixed/' + plantaId]);
      } else {
        this.openSnackBar();
      }
    }
  }

  private openSnackBar() {
    this._snackBar.open('Planta en mantenimiento temporalmente', 'OK', {
      duration: 5000,
      verticalPosition: 'top',
    });
  }
}
