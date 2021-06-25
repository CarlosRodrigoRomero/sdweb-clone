import { Component, OnInit, ViewChild } from '@angular/core';

import { combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ApexAxisChartSeries, ApexDataLabels, ApexChart, ChartComponent } from 'ng-apexcharts';

import { GLOBAL } from '@core/services/global';
import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';

import { Anomalia } from '@core/models/anomalia';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  colors: any;
};
@Component({
  selector: 'app-chart-altura',
  templateUrl: './chart-altura.component.html',
  styleUrls: ['./chart-altura.component.css'],
})
export class ChartAlturaComponent implements OnInit {
  informesIdList: string[];
  allAnomalias: Anomalia[];
  dataLoaded = false;

  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      height: 170,
      width: '100%',
      type: 'heatmap',
    },
    dataLabels: {
      enabled: false,
    },
    colors: [GLOBAL.gris],
  };

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
        const alturaMax = Math.max(
          ...this.allAnomalias.filter((anom) => anom.localY !== undefined).map((anom) => anom.localY)
        );

        for (let index = 1; index <= alturaMax; index++) {
          const row = {
            name: index.toString(),
            data: [],
          };

          dateLabels.forEach((dateLabel, i) => {
            row.data.push({
              x: dateLabel,
              y: this.allAnomalias
                .filter((anom) => anom.informeId === this.informesIdList[i])
                .filter((anom) => anom.localY === index).length,
            });
          });

          this.chartOptions.series.push(row);
        }

        this.dataLoaded = true;
      });
  }

  public generateData(count, yrange) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = 'C' + (i + 1).toString();
      var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push({
        x: x,
        y: y,
      });
      i++;
    }
    return series;
  }
}
