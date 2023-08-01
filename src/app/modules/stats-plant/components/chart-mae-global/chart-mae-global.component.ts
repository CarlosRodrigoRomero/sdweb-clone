import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend,
  ApexAnnotations,
  ApexTooltip,
  ChartType,
  ApexPlotOptions,
} from 'ng-apexcharts';

import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';
import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { AuthService } from '@data/services/auth.service';
import { ThemeService } from '@data/services/theme.service';

import { COLOR } from '@data/constants/color';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
  annotations: ApexAnnotations;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-chart-mae-global',
  templateUrl: './chart-mae-global.component.html',
  styleUrls: ['./chart-mae-global.component.css'],
  providers: [DecimalPipe],
})
export class ChartMaeGlobalComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent;
  chartOptions: Partial<ChartOptions>;
  loadChart = false;
  private maeData: number[] = [];
  private maeColors: string[] = [];
  private maeMedio: number;
  private maeSigma: number;
  private typeChart: ChartType = 'line';
  private dateLabels: string[] = [];
  private mediaLabel: string;
  private maeLabel: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private portfolioControlService: PortfolioControlService,
    private authService: AuthService,
    private decimalPipe: DecimalPipe,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkTranslate();

    this.authService.user$
      .pipe(
        take(1),
        switchMap((user) => this.portfolioControlService.getMaeMedioAndSigmaPortfolio(user)),
        take(1),
        switchMap(([maeMedio, maeSigma]) => {
          this.maeMedio = maeMedio * 100;
          this.maeSigma = maeSigma * 100;

          const informes = this.reportControlService.informes;

          this.maeData = informes.map((inf) => inf.mae * 100);

          if (this.maeMedio !== undefined && this.maeSigma !== undefined) {
            this.maeColors = this.maeData.map((mae) => {
              if (mae >= this.maeMedio + this.maeSigma) {
                return COLOR.colores_severity_rgb[2];
              } else if (mae <= this.maeMedio) {
                return COLOR.colores_severity_rgb[0];
              } else {
                return COLOR.colores_severity_rgb[1];
              }
            });
          }

          return this.informeService.getDateLabelsInformes(informes.map((inf) => inf.id));
        }),
        take(1),
        switchMap((dateLabels) => {
          this.dateLabels = dateLabels;

          return this.themeService.themeSelected$;
        }),
        take(1)
      )
      .subscribe((theme) => {
        // si solo hay un informe cambiamos a grafico tipo barra
        if (this.maeData.length === 1) {
          this.typeChart = 'bar';
        }

        this.chartOptions = {
          series: [
            {
              name: this.maeLabel + ' %',
              data: this.maeData,
            },
          ],
          chart: {
            foreColor: this.themeService.textColor,
            width: '100%',
            type: this.typeChart,
            height: 250,
            toolbar: {
              show: false,
            },
            dropShadow: {
              enabled: true,
              color: '#000',
              top: 18,
              left: 7,
              blur: 10,
              opacity: 0.2,
            },
          },
          colors: this.maeColors,
          dataLabels: {
            enabled: true,
            formatter: (value: number) => this.decimalPipe.transform(value, '1.0-2') + '%',
            style: {
              fontSize: '16px',
            },
            // offsetY: -20,
          },
          markers: {
            size: 1,
          },
          xaxis: {
            categories: this.dateLabels,
          },
          yaxis: {
            title: {
              text: this.maeLabel + ' %',
            },
            labels: {
              formatter: (value) => {
                return this.decimalPipe.transform(value, '1.0-1');
              },
              minWidth: 10,
            },
            min: 0,
            max:
              Math.max(...[...this.maeData, this.maeMedio]) * 1.1 < Math.max(...[...this.maeData, this.maeMedio]) + 0.1
                ? Math.max(...[...this.maeData, this.maeMedio]) * 1.1
                : Math.max(...[...this.maeData, this.maeMedio]) + 0.1,
          },
          legend: {
            show: false,
          },
          annotations: {
            yaxis: [
              {
                y: this.maeMedio,
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
                  text: this.mediaLabel + ' ' + this.decimalPipe.transform(this.maeMedio, '1.0-2') + '%',
                },
              },
            ],
          },
          tooltip: {
            theme: theme.split('-')[0],
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '20%',
              // borderRadius: 8,
              dataLabels: {
                position: 'top', // top, center, bottom
              },
            },
          },
        };
        this.loadChart = true;

        // detectamos cambios porque estamos utilizando la estrategia OnPush
        this.cdr.detectChanges();
      });

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (this.chartOptions) {
          this.chartOptions = {
            ...this.chartOptions,
            chart: {
              type: this.typeChart,
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

  private checkTranslate(): void {
    this.translate
      .get('Media MAE Portfolio')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.mediaLabel = res;
      });

    this.translate
      .get('MAE')
      .pipe(take(1))
      .subscribe((res: string) => {
        this.maeLabel = res;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
