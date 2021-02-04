import { Component, OnInit, ViewChild } from '@angular/core';
import { MapControlService } from '../../services/map-control.service';
import { switchMap } from 'rxjs/operators';
import { AnomaliaService } from '../../../core/services/anomalia.service';
import { FiltrableInterface } from '../../../core/models/filtrableInterface';
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
  ApexPlotOptions,
} from 'ng-apexcharts';
import { GLOBAL } from '@core/services/global';
import { Anomalia } from '../../../core/models/anomalia';

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
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-chart-numsyperd',
  templateUrl: './chart-numsyperd.component.html',
  styleUrls: ['./chart-numsyperd.component.css'],
})
export class ChartNumsyperdComponent implements OnInit {
  @ViewChild('charNumYPer') chartNumYPer: ChartComponent;
  public chartOptionsComun: Partial<ChartOptions>;
  public chartOptions1: Partial<ChartOptions>;
  public chartOptions2: Partial<ChartOptions>;
  private numCategorias: Array<number>;
  public selectedAnomalias: Anomalia[];
  public perdidasPorCategoria: number[];
  public potenciaModuloPorDefecto: number;
  public countCategoria: number[];
  public countCategoriaLabels: string[];
  public chartLoaded = false;
  public coloresCategorias: string[];

  constructor(private mapControlService: MapControlService, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.potenciaModuloPorDefecto = 240;
    // Obtener informeId de map control. Con SwitchMap obtener anomalias
    this.mapControlService.selectedInformeId$
      .pipe(
        switchMap((informeId) => {
          return this.anomaliaService.getAnomalias$(informeId);
        })
      )
      .subscribe((anomalias) => {
        console.log(
          '🚀 ~ file: chart-numsyperd.component.ts ~ line 64 ~ ChartNumsyperdComponent ~ .subscribe ~ anomalias',
          anomalias
        );
        this.selectedAnomalias = anomalias;
        this.initDataChart(anomalias);
        this.initChart();
      });
  }
  initDataChart(anomalias) {
    this.numCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);

    let filtroCategoria: Anomalia[];
    this.perdidasPorCategoria = Array();

    let perdidasCategoria: number;
    this.countCategoria = Array();
    this.countCategoriaLabels = Array();
    this.coloresCategorias = Array();

    this.numCategorias.forEach((i) => {
      filtroCategoria = anomalias.filter((anom) => anom.tipo === i);

      perdidasCategoria = filtroCategoria
        .map((anom) => {
          let numeroModulos: number;
          if (anom.hasOwnProperty('modulosAfectados')) {
            if (isNaN(anom.modulosAfectados)) {
              numeroModulos = 1;
            } else {
              numeroModulos = anom.modulosAfectados;
            }
          } else {
            numeroModulos = 1;
          }

          if (anom.hasOwnProperty('modulo')) {
            if (anom.modulo.hasOwnProperty('potencia')) {
              return GLOBAL.pcPerdidas[i] * numeroModulos;
            }
          }
          return GLOBAL.pcPerdidas[i] * numeroModulos;
        })
        .reduce((a, b) => a + b, 0);

      if (filtroCategoria.length > 0) {
        this.countCategoria.push(filtroCategoria.length);
        this.countCategoriaLabels.push(GLOBAL.labels_tipos[i]);
        this.coloresCategorias.push(GLOBAL.colores_tipos[i]);
        this.perdidasPorCategoria.push(Math.round(perdidasCategoria * 10) / 10);
      }
    });
  }

  initChart() {
    this.chartOptionsComun = {
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '14px',
          colors: ['#304758'],
        },
        offsetX: 0,
        offsetY: -25,
      },

      stroke: {
        curve: 'straight',
      },
      toolbar: {
        tools: {
          selection: false,
        },
      },
      legend: {
        show: false,
      },
      plotOptions: {
        bar: {
          barHeight: '100%',
          columnWidth: '75%',
          distributed: true,
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: {
        categories: this.countCategoriaLabels,
        type: 'category',
        labels: {
          // rotate: 0,
        },
      },

      // tooltip: {
      //   followCursor: false,
      //   theme: 'dark',
      //   x: {
      //     show: false,
      //   },
      //   marker: {
      //     show: false,
      //   },
      //   y: {
      //     title: {
      //       formatter: (s) => {
      //         return s;
      //       },
      //     },
      //   },
      // },
      // grid: {
      //   clipMarkers: false
      // },
    };

    this.chartOptions1 = {
      xaxis: {
        categories: this.countCategoriaLabels,
        type: 'category',
        labels: {
          show: false,
          // rotate: 0,
        },
      },
      series: [
        {
          name: '# Anomalias',
          data: this.countCategoria,
        },
      ],
      colors: this.coloresCategorias,
      title: {
        text: '# Anomalías',
        align: 'left',
      },

      chart: {
        id: 'fb',
        group: 'social',
        type: 'bar',
        width: '100%',
        height: 160,
      },

      yaxis: {
        max: (v) => {
          return Math.round(1.1 * v);
        },
        tickAmount: 3,
        labels: {
          // minWidth: 100,
        },
      },
    };

    this.chartOptions2 = {
      series: [
        {
          name: 'MAE',
          data: this.perdidasPorCategoria,
        },
      ],
      title: {
        text: 'Módulos Apagados Equivalentes (MAE)',
        align: 'left',
      },
      chart: {
        id: 'tw',
        group: 'social',
        type: 'bar',
        width: '100%',

        // height: 160,
      },
      xaxis: {
        categories: this.countCategoriaLabels,
        type: 'category',
        labels: {
          // show: false,
          // rotate: 0,
        },
      },
      colors: ['#B50202'],
      yaxis: {
        max: (v) => {
          return Math.round(1.1 * v);
        },
        forceNiceScale: true,
        tickAmount: 3,
        labels: {
          minWidth: 10,
        },
      },
    };
    this.chartLoaded = true;
  }
}
