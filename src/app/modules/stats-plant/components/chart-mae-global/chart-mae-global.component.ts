import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { switchMap, take } from 'rxjs/operators';

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
  toolbar: any;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-chart-mae-global',
  templateUrl: './chart-mae-global.component.html',
  styleUrls: ['./chart-mae-global.component.css'],
  providers: [DecimalPipe],
})
export class ChartMaeGlobalComponent implements OnInit {
  @ViewChildren('chart') chart: ChartComponent;
  chartOptionsMAE: Partial<ChartOptions>;
  loadChart = false;
  private maeData: number[] = [];
  private maeColors: string[] = [];
  private maeMedio: number;
  private maeSigma: number;
  private foreColor = '#000';
  private typeChart: ChartType = 'line';
  private theme = 'light';
  private dateLabels: string[] = [];

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private portfolioControlService: PortfolioControlService,
    private authService: AuthService,
    private decimalPipe: DecimalPipe,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
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
        // aplicamos el tema seleccionado
        this.changeTheme(theme);

        // si solo hay un informe cambiamos a grafico tipo barra
        if (this.maeData.length === 1) {
          this.typeChart = 'bar';
        }

        this.chartOptionsMAE = {
          series: [
            {
              name: 'MAE %',
              data: this.maeData,
            },
          ],
          chart: {
            foreColor: this.foreColor,
            width: '100%',
            type: this.typeChart,
            height: 250,
            dropShadow: {
              enabled: true,
              color: '#000',
              top: 18,
              left: 7,
              blur: 10,
              opacity: 0.2,
            },
            toolbar: {
              show: true,
              offsetX: 0,
              offsetY: 0,
              tools: {
                download: true,
                selection: false,
                zoom: false,
                zoomin: false,
                zoomout: false,
                pan: false,
                reset: false,
                customIcons: [],
              },
            },
          },
          colors: this.maeColors,
          dataLabels: {
            enabled: true,
            formatter: (value) => this.decimalPipe.transform(value, '1.0-2') + '%',
            style: {
              fontSize: '16px',
            },
          },
          markers: {
            size: 1,
          },
          xaxis: {
            categories: this.dateLabels,
          },
          yaxis: {
            title: {
              text: 'MAE %',
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
                  text: 'Media MAE Portfolio ' + this.decimalPipe.transform(this.maeMedio, '1.0-2') + '%',
                },
              },
            ],
          },
          tooltip: {
            theme: this.theme,
          },
        };
        this.loadChart = true;

        // detectamos cambios porque estamos utilizando la estrategia OnPush
        this.cdr.detectChanges();
      });

    this.themeService.themeSelected$.subscribe((theme) => {
      if (this.chartOptionsMAE) {
        // aplicamos el tema seleccionado
        this.changeTheme(theme);

        this.chartOptionsMAE = {
          ...this.chartOptionsMAE,
          chart: {
            type: this.typeChart,
            foreColor: this.foreColor,
          },
          tooltip: {
            theme: this.theme,
          },
        };
      }
    });
  }

  private changeTheme(theme: string): void {
    if (theme === 'dark-theme') {
      this.foreColor = '#fff';
      this.theme = 'dark';
    } else {
      this.foreColor = '#000';
      this.theme = 'light';
    }
  }
}
