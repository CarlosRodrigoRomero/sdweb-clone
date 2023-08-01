import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

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
  ApexTooltip,
} from 'ng-apexcharts';

import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ThemeService } from '@data/services/theme.service';

import { Anomalia } from '@core/models/anomalia';

import { Colors } from '@core/classes/colors';

import { COLOR } from '@data/constants/color';
import { switchMap, take } from 'rxjs/operators';

export type ChartOptions = {
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
  colors: string[];
};

@Component({
  selector: 'app-chart-cels-grad',
  templateUrl: './chart-cels-grad.component.html',
  styleUrls: ['./chart-cels-grad.component.css'],
})
export class ChartCelsGradComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  dataLoaded = false;
  informesIdList: string[];
  allAnomalias: Anomalia[] = [];
  dateLabels: string[];
  private gradienteMinimoCriterio = 0;
  private categories: string[];
  private celsCalientesLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private anomaliaService: AnomaliaService,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.translate
      .get('Céls. calientes')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.celsCalientesLabel = res;
      });

    this.informesIdList = this.reportControlService.informesIdList;

    this.allAnomalias = this.reportControlService.allAnomalias;

    this.subscriptions.add(
      this.informeService
        .getDateLabelsInformes(this.informesIdList)
        .pipe(
          take(1),
          switchMap((dateLabels) => {
            this.dateLabels = dateLabels;

            return this.themeService.themeSelected$;
          }),
          take(1)
        )
        .subscribe((theme) => {
          const data = [];

          this.informesIdList.forEach((informeId) => {
            const celsCals = this.allAnomalias
              .filter((anom) => anom.informeId === informeId)
              // tslint:disable-next-line: triple-equals
              .filter((anom) => anom.tipo == 8 || anom.tipo == 9);

            this.gradienteMinimoCriterio = this.anomaliaService.criterioCriticidad.rangosDT[0];

            if (this.gradienteMinimoCriterio < 10) {
              const range1 = celsCals.filter((cc) => cc.gradienteNormalizado < 10 && cc.gradienteNormalizado >= 0);
              const range2 = celsCals.filter((cc) => cc.gradienteNormalizado < 20 && cc.gradienteNormalizado >= 10);
              const range3 = celsCals.filter((cc) => cc.gradienteNormalizado < 30 && cc.gradienteNormalizado >= 20);
              const range4 = celsCals.filter((cc) => cc.gradienteNormalizado < 40 && cc.gradienteNormalizado >= 30);
              const range5 = celsCals.filter((cc) => cc.gradienteNormalizado >= 40);

              this.categories = [
                this.gradienteMinimoCriterio.toString() + '-10 ºC',
                '10-20 ºC',
                '20-30 ºC',
                '30-40 ºC',
                '>40 ºC',
              ];

              data.push([range1.length, range2.length, range3.length, range4.length, range5.length]);
            } else {
              const range1 = celsCals.filter((cc) => cc.gradienteNormalizado < 20 && cc.gradienteNormalizado >= 10);
              const range2 = celsCals.filter((cc) => cc.gradienteNormalizado < 30 && cc.gradienteNormalizado >= 20);
              const range3 = celsCals.filter((cc) => cc.gradienteNormalizado < 40 && cc.gradienteNormalizado >= 30);
              const range4 = celsCals.filter((cc) => cc.gradienteNormalizado >= 40);

              this.categories = ['10-20 ºC', '20-30 ºC', '30-40 ºC', '>40 ºC'];

              data.push([range1.length, range2.length, range3.length, range4.length]);
            }
          });

          this._initChartData(data, theme.split('-')[0]);
        })
    );

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptions) {
          this.chartOptions = {
            ...this.chartOptions,
            chart: {
              ...this.chartOptions.chart,
              foreColor: this.themeService.textColor,
            },
            tooltip: {
              theme: theme.split('-')[0],
            },
          };
        }
      })
    );
  }

  private _initChartData(data: any[], theme: string): void {
    const series = this.dateLabels.map((dateLabel, index) => {
      return { name: dateLabel, data: data[index] };
    });

    const opacity = new Array(series.length);
    for (let index = 0; index < opacity.length; index++) {
      opacity[index] = 1 - (opacity.length - (index + 1)) * 0.25;
    }

    const colors = new Array(series.length);
    opacity.forEach((op, index) => {
      colors[index] = Colors.hexToRgb(COLOR.gris, op);
    });

    this.chartOptions = {
      series,
      chart: {
        type: 'bar',
        height: 250,
        toolbar: {
          show: false,
        },
        foreColor: this.themeService.textColor,
      },
      legend: {
        show: true,
        showForSingleSeries: true,
        markers: {
          fillColors: colors,
        },
        onItemHover: {
          highlightDataSeries: false,
        },
      },
      colors: [COLOR.gris, COLOR.gris],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          // endingShape: 'rounded',
        },
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        colors,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: this.categories,
      },
      yaxis: {
        title: {
          text: '# ' + this.celsCalientesLabel,
        },
        labels: {
          minWidth: 10,
          formatter: (value) => {
            return Math.round(value).toString();
          },
        },
      },
      tooltip: {
        y: {
          formatter: (val) => {
            return val + '';
          },
        },
        theme,
      },
    };
    this.dataLoaded = true;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
