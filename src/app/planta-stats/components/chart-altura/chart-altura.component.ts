import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { combineLatest, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ApexAxisChartSeries, ApexDataLabels, ApexChart, ChartComponent, ApexYAxis } from 'ng-apexcharts';

import { GLOBAL } from '@core/services/global';
import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';

import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  colors: any;
  yaxis: ApexYAxis;
};
@Component({
  selector: 'app-chart-altura',
  templateUrl: './chart-altura.component.html',
  styleUrls: ['./chart-altura.component.css'],
})
export class ChartAlturaComponent implements OnInit, OnDestroy {
  informesIdList: string[];
  allAnomalias: Anomalia[];
  dataLoaded = false;
  private planta: PlantaInterface;

  private subscriptions: Subscription = new Subscription();

  @ViewChild('chart') chart: ChartComponent;

  public chartOptions: Partial<ChartOptions> = {
    series: [
      {
        name: 'A',
        data: [
          { x: 'Jul 2019', y: 35 },
          { x: 'Jun 2020', y: 25 },
        ],
      },
      {
        name: 'B',
        data: [
          { x: 'Jul 2019', y: 20 },
          { x: 'Jun 2020', y: 17 },
        ],
      },
      {
        name: 'C',
        data: [
          { x: 'Jul 2019', y: 20 },
          { x: 'Jun 2020', y: 15 },
        ],
      },
      {
        name: 'D',
        data: [
          { x: 'Jul 2019', y: 15 },
          { x: 'Jun 2020', y: 25 },
        ],
      },
      {
        name: 'E',
        data: [
          { x: 'Jul 2019', y: 18 },
          { x: 'Jun 2020', y: 20 },
        ],
      },
      {
        name: 'F',
        data: [
          { x: 'Jul 2019', y: 36 },
          { x: 'Jun 2020', y: 18 },
        ],
      },
    ],
    chart: {
      height: 170,
      width: '100%',
      type: 'heatmap',
    },
    dataLabels: {
      enabled: false,
    },
    colors: [GLOBAL.gris],
    yaxis: {
      title: {
        text: 'Fila',
      },
    },
  };

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([
        this.reportControlService.allFilterableElements$,
        this.reportControlService.informesIdList$,
        this.plantaService.getPlanta(this.reportControlService.plantaId),
      ])
        .pipe(
          switchMap(([elems, informesId, planta]) => {
            this.allAnomalias = elems as Anomalia[];
            this.informesIdList = informesId;
            this.planta = planta;

            return this.informeService.getDateLabelsInformes(this.informesIdList);
          })
        )
        .subscribe((dateLabels) => {
          const alturaMax = this.planta.filas;

          const series = [];
          for (let index = alturaMax; index > 0; index--) {
            const row = {
              name: index.toString(),
              data: [],
            };

            dateLabels.forEach((dateLabel, i) => {
              row.data.push({
                x: dateLabel,
                y: this.allAnomalias
                  .filter((anom) => anom.informeId === this.informesIdList[i])
                  .filter((anom) => anom.localY == index).length,
              });
            });

            series.push(row);
          }

          // aplicamos a todas salvo a DEMO
          if (this.reportControlService.plantaId !== 'egF0cbpXnnBnjcrusoeR') {
            this.chartOptions.series = series;
          }

          this.dataLoaded = true;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
