import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';

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
  ApexGrid,
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
  grid: ApexGrid;
  colors: string[];
}
@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css'],
  providers: [DecimalPipe],
})
export class BarChartComponent implements OnInit {
  public barChartLabels = Array<string>();
  public data = Array<number>();
  public coloresChart = Array<string>();
  @ViewChild('chart', { static: false }) chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  private maePlantas: number[] = [];
  private maeMedio: number;
  private maeSigma: number;
  public dataLoaded = false;
  public plantasId: string[] = [];
  public tiposPlantas: string[] = [];
  public plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private informesRecientes: InformeInterface[] = [];
  private plantasChart: PlantaChart[] = [];
  public chartZoomed = true;
  private chartPosition = 0;
  public chartStart = true;
  public chartEnd = false;
  private endChart = 50;

  constructor(
    public auth: AuthService,
    private portfolioControlService: PortfolioControlService,
    private router: Router,
    private _snackBar: MatSnackBar,
    private decimalPipe: DecimalPipe
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
      this.informesRecientes.push(plant.informeReciente);
      this.barChartLabels.push(plant.planta.nombre);
      this.coloresChart.push(this.getColorMae(plant.mae));
    });

    this.initChart();
  }

  initChart() {
    let series: ApexAxisChartSeries;
    let xaxis: ApexXAxis;
    if (this.plantas.length > 50) {
      // empezamos con el gráfico ampliado
      series = [
        {
          name: 'MAE Planta',
          data: this.data.filter((_, index) => index < 50),
        },
      ];
      xaxis = {
        categories: this.barChartLabels.filter((_, index) => index < 50),
        labels: {
          trim: true,
          maxHeight: 80,
        },
      };
    } else {
      series = [
        {
          name: 'MAE Planta',
          data: this.data,
        },
      ];
      xaxis = {
        categories: this.barChartLabels,
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
            this.onClick(index);
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
          Math.max(...[...this.data, this.maeMedio * 100]) * 1.1 <
          Math.max(...[...this.data, this.maeMedio * 100]) + 0.1
            ? Math.max(...[...this.data, this.maeMedio * 100]) * 1.1
            : Math.max(...[...this.data, this.maeMedio * 100]) + 0.1,
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
              text: 'Media MAE Portfolio ' + this.decimalPipe.transform(this.maeMedio * 100, '1.0-2') + '%',
            },
          },
        ],
      },
    };

    this.dataLoaded = true;
  }

  private getColorMae(mae: number): string {
    if (this.plantas.length < 3) {
      if (mae >= 2) {
        return GLOBAL.colores_mae[2];
      } else if (mae < 1) {
        return GLOBAL.colores_mae[0];
      } else {
        return GLOBAL.colores_mae[1];
      }
    } else {
      if (mae >= this.maeMedio + this.maeSigma) {
        return GLOBAL.colores_mae[2];
      } else if (mae <= this.maeMedio) {
        return GLOBAL.colores_mae[0];
      } else {
        return GLOBAL.colores_mae[1];
      }
    }
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
    const sum = data.reduce((sum, value) => {
      return sum + value;
    }, 0);

    const avg = sum / data.length;
    return avg;
  }

  private onClick(index: number) {
    if (index !== -1) {
      const plantaId = this.plantasId[index];
      const tipoPlanta = this.tiposPlantas[index];
      const informeReciente = this.informesRecientes[index];

      if (!this.checkFake(plantaId)) {
        // comprobamos si es una planta que solo se ve en el informe antiguo
        if (this.portfolioControlService.checkPlantaSoloWebAntigua(plantaId)) {
          this.navigateOldReport(informeReciente.id);
        } else {
          if (tipoPlanta === 'seguidores') {
            this.router.navigate(['clients/tracker/' + plantaId]);
          } else if (informeReciente.fecha > GLOBAL.newReportsDate || plantaId === 'egF0cbpXnnBnjcrusoeR') {
            this.router.navigate(['clients/fixed/' + plantaId]);
          } else {
            this.openSnackBar();
          }
        }
      } else {
        this.openSnackBarDemo();
      }
    }
  }

  private navigateOldReport(informeId: string) {
    this.router.navigate(['clientes/informe-view/' + informeId + '/informe-overview']);
  }

  private openSnackBar() {
    this._snackBar.open('Planta en mantenimiento temporalmente', 'OK', {
      duration: 5000,
      verticalPosition: 'top',
    });
  }

  private openSnackBarDemo() {
    this._snackBar.open('Planta sin contenido. Acceda a "Demo 1"', '', {
      duration: 5000,
      verticalPosition: 'top',
    });
  }

  public updateOptions(value: string): void {
    let dataFiltered;
    let labelsFiltered;
    let colorsFiltered;

    switch (value) {
      case 'all':
        this.chartZoomed = false;
        dataFiltered = this.data;
        labelsFiltered = this.barChartLabels;
        colorsFiltered = this.coloresChart;
        break;
      case 'start':
        this.chartZoomed = true;
        this.chartPosition = 0;
        dataFiltered = this.data.filter((_, index) => index < 50);
        labelsFiltered = this.barChartLabels.filter((_, index) => index < 50);
        colorsFiltered = this.coloresChart.filter((_, index) => index < 50);
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
        labelsFiltered = this.barChartLabels.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        colorsFiltered = this.coloresChart.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        break;
      case 'right':
        this.chartStart = false;
        this.chartPosition += 50;
        this.endChart = this.chartPosition + 50;
        if (this.plantas.length - this.chartPosition < 50) {
          this.chartEnd = true;
          this.endChart = this.plantas.length;
        }
        dataFiltered = this.data.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        labelsFiltered = this.barChartLabels.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        colorsFiltered = this.coloresChart.filter((_, index) => index >= this.chartPosition && index < this.endChart);
        break;
    }

    this.chartOptions.series = [
      {
        name: 'MAE Planta',
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
        Math.max(...[...dataFiltered, this.maeMedio * 100]) * 1.1 <
        Math.max(...[...dataFiltered, this.maeMedio * 100]) + 0.1
          ? Math.max(...[...dataFiltered, this.maeMedio * 100]) * 1.1
          : Math.max(...[...dataFiltered, this.maeMedio * 100]) + 0.1,
      labels: {
        formatter: (value) => {
          return Math.round(value * 10) / 10 + '%';
        },
      },
    };
    this.chartOptions.colors = colorsFiltered;
  }

  private checkFake(plantaId: string): boolean {
    const fakeIds = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    if (fakeIds.includes(plantaId)) {
      return true;
    } else {
      return false;
    }
  }
}
