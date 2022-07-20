import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Subscription } from 'rxjs';

import { ApexAxisChartSeries, ApexDataLabels, ApexChart, ChartComponent, ApexYAxis, ApexTooltip } from 'ng-apexcharts';

import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';

import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';

import { COLOR } from '@data/constants/color';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  colors: any;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
};
@Component({
  selector: 'app-chart-altura',
  templateUrl: './chart-altura.component.html',
  styleUrls: ['./chart-altura.component.css'],
  providers: [DecimalPipe],
})
export class ChartAlturaComponent implements OnInit, OnDestroy {
  informesIdList: string[];
  allAnomalias: Anomalia[] = [];
  allCC: Anomalia[] = [];
  dataLoaded = false;
  private planta: PlantaInterface;

  private subscriptions: Subscription = new Subscription();

  @ViewChild('chart') chart: ChartComponent;

  public chartOptions: Partial<ChartOptions> = {
    series: [
      {
        name: '1',
        data: [
          { x: 'Jul 2019', y: 35 },
          { x: 'Jun 2020', y: 25 },
        ],
      },
      {
        name: '2',
        data: [
          { x: 'Jul 2019', y: 20 },
          { x: 'Jun 2020', y: 17 },
        ],
      },
      {
        name: '3',
        data: [
          { x: 'Jul 2019', y: 20 },
          { x: 'Jun 2020', y: 15 },
        ],
      },
      {
        name: '4',
        data: [
          { x: 'Jul 2019', y: 15 },
          { x: 'Jun 2020', y: 25 },
        ],
      },
      {
        name: '5',
        data: [
          { x: 'Jul 2019', y: 18 },
          { x: 'Jun 2020', y: 20 },
        ],
      },
      {
        name: '6',
        data: [
          { x: 'Jul 2019', y: 36 },
          { x: 'Jun 2020', y: 18 },
        ],
      },
    ],
    chart: {
      height: 170,
      type: 'heatmap',
    },
    dataLabels: {
      enabled: false,
    },
    colors: [COLOR.gris],
    yaxis: {
      title: {
        text: 'Fila',
      },
      labels: {
        minWidth: 50,
        formatter: (value) => {
          return this.decimalPipe.transform(value, '1.0-0');
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value) => {
          return value.toString();
        },
      },
    },
  };

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private decimalPipe: DecimalPipe,
    private anomaliaInfoService: AnomaliaInfoService
  ) {}

  ngOnInit(): void {
    this.allAnomalias = this.reportControlService.allAnomalias;

    // tslint:disable-next-line: triple-equals
    this.allCC = this.allAnomalias.filter((anom) => anom.tipo == 8 || anom.tipo == 9);

    this.informesIdList = this.reportControlService.informesIdList;
    this.planta = this.reportControlService.planta;

    this.subscriptions.add(
      this.informeService.getDateLabelsInformes(this.informesIdList).subscribe((dateLabels) => {
        const alturaMax = this.planta.filas;

        if (this.allCC.length > 0) {
          const series = [];
          if (this.planta.alturaBajaPrimero) {
            for (let index = 1; index <= alturaMax; index++) {
              const row = {
                name: index.toString(),
                data: [],
              };

              dateLabels.forEach((dateLabel, i) => {
                row.data.push({
                  x: dateLabel,
                  y: this.allCC
                    .filter((anom) => anom.informeId === this.informesIdList[i])
                    // tslint:disable-next-line: triple-equals
                    .filter((anom) => this.anomaliaInfoService.getAlturaAnom(anom, this.planta) == index).length,
                });
              });

              series.push(row);
            }
          } else {
            for (let index = alturaMax; index > 0; index--) {
              const row = {
                name: index.toString(),
                data: [],
              };

              dateLabels.forEach((dateLabel, i) => {
                row.data.push({
                  x: dateLabel,
                  y: this.allCC
                    .filter((anom) => anom.informeId === this.informesIdList[i])
                    // tslint:disable-next-line: triple-equals
                    .filter((anom) => anom.localY == index).length,
                });
              });

              series.push(row);
            }
          }

          // aplicamos a todas salvo a DEMO
          if (this.reportControlService.plantaId !== 'egF0cbpXnnBnjcrusoeR') {
            this.chartOptions.series = series;
          }

          this.dataLoaded = true;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
