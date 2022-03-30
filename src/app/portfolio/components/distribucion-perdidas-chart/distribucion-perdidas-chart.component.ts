import { Component, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ChartComponent,
  ApexLegend,
  ApexDataLabels,
  ApexPlotOptions,
  ApexTooltip,
} from 'ng-apexcharts';

import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  toolTip: ApexTooltip;
};

interface PlantaChart {
  planta: PlantaInterface;
  perdidas: number;
}

@Component({
  selector: 'app-distribucion-perdidas-chart',
  templateUrl: './distribucion-perdidas-chart.component.html',
  styleUrls: ['./distribucion-perdidas-chart.component.css'],
  providers: [DecimalPipe],
})
export class DistribucionPerdidasChartComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent;
  chartOptions: Partial<ChartOptions>;
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private maePlantas: number[] = [];
  private perdidasChart: PlantaChart[] = [];
  dataPerdidas: number[] = [];
  plantasId: string[] = [];
  labels: string[] = [];

  constructor(private portfolioControlService: PortfolioControlService, private decimalPipe: DecimalPipe) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;
    this.maePlantas = this.portfolioControlService.maePlantas;

    this.plantas.forEach((planta, index) => {
      const perdidasInfActual = this.maePlantas[index] * planta.potencia;
      if (perdidasInfActual !== undefined) {
        this.perdidasChart.push({ planta, perdidas: perdidasInfActual });
      }
    });

    this.perdidasChart.sort((a, b) => b.perdidas - a.perdidas);

    this.perdidasChart.forEach((plant) => {
      this.dataPerdidas.push(plant.perdidas * 1000);
      this.plantasId.push(plant.planta.id);
      this.labels.push(plant.planta.nombre);
    });

    this.initChart();
  }

  private initChart() {
    this.chartOptions = {
      series: this.dataPerdidas,
      chart: {
        type: 'donut',
        width: '130%', // es mayor por la relación de aspecto del gráfico
      },
      labels: this.labels,
      legend: {
        show: false,
      },
      dataLabels: {
        style: {
          fontFamily: 'Roboto',
          fontWeight: 500,
        },
        formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + ' kW',
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              // value: {
              //   show: true,
              //   fontFamily: 'Roboto',
              //   formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + ' kW',
              // },
              total: {
                show: true,
                showAlways: true,
                label: 'Pérdidas totales',
                fontFamily: 'Roboto',
                formatter: (w) => {
                  const total = w.globals.seriesTotals.reduce((a, b) => {
                    return a + b;
                  }, 0);
                  return this.decimalPipe.transform(total, '1.0-2') + ' kW';
                },
              },
            },
          },
        },
      },
      toolTip: {
        enabled: true,
        fixed: {
          enabled: true,
          position: 'topRight',
        },
        y: {
          formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + ' kW',
        },
      },
      // responsive: [
      //   {
      //     breakpoint: 2400,
      //     options: {
      //       chart: {
      //         width: '100%',
      //       },
      //       legend: {
      //         position: 'bottom',
      //       },
      //     },
      //   },
      // ],
    };
  }
}
