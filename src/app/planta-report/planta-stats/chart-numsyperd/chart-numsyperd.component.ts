import { Component, OnInit, ViewChild } from '@angular/core';
import { MapControlService } from '../../services/map-control.service';
import { switchMap, take } from 'rxjs/operators';
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
import { ActivatedRoute } from '@angular/router';
import { InformeService } from '@core/services/informe.service';
import { InformeInterface } from '../../../core/models/informe';

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

export interface DataPlot {
  anomalias: Anomalia[];
  informeId: string;
  numPorCategoria: number[];
  perdidasPorCategoria: number[];
  labelsCategoria: string[];
  coloresCategoria: string[];
}

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
  public selectedAnomalias: Anomalia[];

  public labelsCategoria: string[];
  public coloresCategoria: string[];
  public numsCategoria: number[];

  public chartLoaded = false;
  public plantaId: string;
  public selectedInformeId: string;
  public informesList: string[];
  public dataPlot: DataPlot[];
  public allAnomalias: Anomalia[];

  constructor(
    private informeService: InformeService,
    private route: ActivatedRoute,
    private mapControlService: MapControlService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];

    this.anomaliaService
      .getAnomaliasPlanta$(this.plantaId)
      .pipe(take(1))
      .subscribe((anomalias) => {
        this.allAnomalias = anomalias;
        this.dataPlot = [];
        this._getAllCategorias(anomalias);

        this.informesList.forEach((informeId) => {
          const anomaliasInforme = this.allAnomalias.filter((item) => item.informeId == informeId);
          this.dataPlot.push(this._calculateDataPlot(anomaliasInforme, informeId));
        });
        this.initChart();
      });

    // Obtener informeId de map control. Con SwitchMap obtener anomalias
    //   this.mapControlService.selectedInformeId$
    //     .pipe(
    //       switchMap((informeId) => {
    //         this.selectedInformeId = informeId;
    //         return this.anomaliaService.getAnomalias$(informeId);
    //       })
    //     )
    //     .subscribe((anomalias) => {
    //       this.selectedAnomalias = anomalias;
    //     });
    // }
  }
  private _getAllCategorias(anomalias): void {
    const allNumCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);

    const labelsCategoria = Array<string>();
    const coloresCategoria = Array<string>();
    const numsCategoria = Array<number>();

    allNumCategorias.forEach((i) => {
      if (anomalias.filter((anom) => anom.tipo === i).length > 0) {
        labelsCategoria.push(GLOBAL.labels_tipos[i]);
        coloresCategoria.push(GLOBAL.colores_tipos[i]);
        numsCategoria.push(i);
      }
    });
    this.labelsCategoria = labelsCategoria;
    this.coloresCategoria = coloresCategoria;
    this.numsCategoria = numsCategoria;
  }

  private _calculateDataPlot(anomalias, informeId: string): DataPlot {
    let filtroCategoria: Anomalia[];
    let perdidasCategoria: number;

    const numPorCategoria = Array();
    const perdidasPorCategoria = Array();

    this.numsCategoria.forEach((i) => {
      filtroCategoria = anomalias.filter((anom) => anom.tipo === i);
      if (filtroCategoria.length > 0) {
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

            return GLOBAL.pcPerdidas[i] * numeroModulos;
          })
          .reduce((a, b) => a + b, 0);

        perdidasPorCategoria.push(Math.round(perdidasCategoria * 10) / 10);
        numPorCategoria.push(filtroCategoria.length);
      } else {
        numPorCategoria.push(0);
        perdidasPorCategoria.push(0);
      }
    });
    return {
      anomalias,
      informeId,
      numPorCategoria,
      perdidasPorCategoria,
      labelsCategoria: this.labelsCategoria,
      coloresCategoria: this.coloresCategoria,
    };
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
        show: true,
        width: 2,
        colors: ['transparent'],
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

          columnWidth: '45%',

          distributed: true,
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: {
        categories: this.labelsCategoria,
        type: 'category',
        labels: {
          // rotate: 0,
        },
      },

      tooltip: {
        followCursor: false,
        theme: 'dark',
        x: {
          show: false,
        },
        marker: {
          show: false,
        },
        y: {
          title: {
            formatter: (s) => {
              return s;
            },
          },
        },
      },
      // grid: {
      //   clipMarkers: false,
      // },
    };

    this.chartOptions1 = {
      series: [
        {
          name: '# Anomalias 2019',
          data: this.dataPlot[0].numPorCategoria,
        },
        {
          name: '# Anomalias 2020',
          data: this.dataPlot[1].numPorCategoria,
        },
      ],
      colors: this.coloresCategoria,
      title: {
        text: '# Anomalías',
        align: 'left',
      },

      chart: {
        id: 'fb',
        group: 'social',
        type: 'bar',
        width: '100%',
        // height: 160,
      },

      yaxis: {
        max: (v) => {
          return Math.round(1.1 * v);
        },
        tickAmount: 3,
        labels: {
          minWidth: 100,
        },
      },
    };

    this.chartOptions2 = {
      series: [
        {
          name: 'MAE 2019',
          data: this.dataPlot[0].perdidasPorCategoria,
        },
        {
          name: 'MAE 2020',
          data: this.dataPlot[1]['perdidasPorCategoria'],
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

      colors: ['#999999'],
      yaxis: {
        max: (v) => {
          return Math.round(1.1 * v);
        },
        forceNiceScale: true,
        tickAmount: 3,
        labels: {
          minWidth: 100,
        },
      },
    };
    this.chartLoaded = true;
  }
}
