import { Component, OnInit } from '@angular/core';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { PcInterface } from '@core/models/pc';
import { GLOBAL } from '@core/services/global';
import { PcService } from '@core/services/pc.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';

@Component({
  selector: 'app-informe-overview',
  templateUrl: './informe-overview.component.html',
  styleUrls: ['./informe-overview.component.css'],
})
export class InformeOverviewComponent implements OnInit {
  public informe: InformeInterface;
  public planta: PlantaInterface;
  public allPcs: PcInterface[];

  public numCategorias: Array<number>;
  public numClases: Array<number>;
  public perdidasPorCategoria: Array<number>;
  public perdidasPorClase: Array<number>;
  public dataPerdidasCategoria: any;
  public dataCountCategoria: any;
  public dataPerdidasTotales: any;
  public perdidasPorCategoriaLabels: string[];
  public chartOptionsCount: any;
  public chartOptionsPerdidas: any;
  public chartOptionsDonut: any;
  public perdidasTotales: number;
  public dataSeveridad: any;
  public countCategoria: number[];
  public countCategoriaLabels: string[];
  private stepSize: number;

  constructor(
    public pcService: PcService,
    private plantaService: PlantaService,
    private informeService: InformeService
  ) {}

  ngOnInit() {
    this.planta = this.plantaService.get();
    this.informe = this.informeService.get();
    this.allPcs = this.pcService.get();
    this.stepSize = 4;
    this.perdidasPorClase = Array();

    this.numCategorias = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i + 1);
    this.numClases = Array(GLOBAL.labels_severidad.length)
      .fill(0)
      .map((_, i) => i + 1);

    // Pérdidas por categoria
    let perdidasCategoria: number;
    this.perdidasPorCategoria = Array();
    this.perdidasPorCategoriaLabels = Array();
    this.countCategoria = Array();
    this.countCategoriaLabels = Array();

    let filtroCategoria: PcInterface[];

    for (const i of this.numCategorias) {
      filtroCategoria = this.allPcs.filter((pc) => pc.tipo === i);

      perdidasCategoria = filtroCategoria
        .map((pc) => {
          let numeroModulos: number;
          if (pc.hasOwnProperty('modulosAfectados')) {
            if (isNaN(pc.modulosAfectados)) {
              numeroModulos = 1;
            } else {
              numeroModulos = pc.modulosAfectados;
            }
          } else {
            numeroModulos = 1;
          }

          if (pc.hasOwnProperty('modulo')) {
            if (pc.modulo.hasOwnProperty('potencia')) {
              return GLOBAL.pcPerdidas[i] * numeroModulos * pc.modulo.potencia;
            }
          }
          return GLOBAL.pcPerdidas[i] * numeroModulos * this.planta.moduloPotencia;
        })
        .reduce((a, b) => a + b, 0);

      if (filtroCategoria.length > 0) {
        this.countCategoria.push(filtroCategoria.length);
        this.countCategoriaLabels.push(GLOBAL.labels_tipos[i]);

        // En KW (dividimos entre 1000)
        this.perdidasPorCategoria.push(Math.round((perdidasCategoria * 10) / 1000) / 10);
        this.perdidasPorCategoriaLabels.push(GLOBAL.labels_tipos[i]);
      }
    }

    // Pérdidas por clase
    let perdidasClase: number;
    let filtroClase;
    for (const i of this.numClases) {
      filtroClase = this.allPcs.filter((pc) => this.pcService.getPcCoA(pc) === i);

      perdidasClase = filtroClase
        .map((pc) => {
          let numeroModulos;
          if (pc.modulosAfectados) {
            numeroModulos = pc.modulosAfectados;
          } else {
            numeroModulos = 1;
          }
          return GLOBAL.pcPerdidas[pc.tipo] * numeroModulos;
        })
        .reduce((a, b) => a + b, 0);

      this.perdidasPorClase.push(Math.round(perdidasClase * 10) / 10);
    }

    this.dataPerdidasCategoria = {
      labels: this.perdidasPorCategoriaLabels,
      datasets: [
        {
          label: 'Pérdidas (kW)',
          backgroundColor: '#ffd04a',

          data: this.perdidasPorCategoria,
        },
      ],
    };

    this.dataCountCategoria = {
      labels: this.countCategoriaLabels,
      datasets: [
        {
          label: 'Número de anomalías',
          backgroundColor: 'grey',

          data: this.countCategoria,
        },
      ],
    };

    // Pérdidas totales en kW
    this.perdidasTotales = Math.round(this.perdidasPorCategoria.reduce((a, b) => a + b, 0) * 10) / 10;

    this.informe.mae = Math.round((this.perdidasTotales / 10 / this.planta.potencia) * 100) / 100;
    this.informeService.updateInforme(this.informe);

    // this.informeService.updateInforme(this.informe);

    this.dataPerdidasTotales = {
      labels: ['Pérdidas nominales (kW)', 'Potencia nominal no afectada'],
      datasets: [
        {
          label: 'Pérdidas',
          backgroundColor: ['#ffd04a', 'grey'],
          // hoverBackgroundColor: GLOBAL.colores_severidad,
          data: [this.perdidasTotales, this.planta.potencia * 1000 - this.perdidasTotales],
        },
      ],
    };

    const max1 = this.perdidasPorCategoria.reduce((a, b) => {
      return Math.max(a, b);
    });
    const max2 = this.countCategoria.reduce((a, b) => {
      return Math.max(a, b);
    });

    this.chartOptionsPerdidas = {
      legend: { display: false },
      scales: {
        yAxes: [
          {
            display: true,
            ticks: {
              stepSize: Math.round(max1 / this.stepSize),
              suggestedMin: 0, // minimum will be 0, unless there is a lower value.
              // OR //
              beginAtZero: true, // minimum value will be 0.
            },
          },
        ],
      },
    };
    this.chartOptionsDonut = {
      legend: { display: false },
      scales: {
        yAxes: [
          {
            display: true,
            ticks: {
              stepSize: 100,
              suggestedMin: 0, // minimum will be 0, unless there is a lower value.
              // OR //
              beginAtZero: true, // minimum value will be 0.
            },
          },
        ],
      },
    };
    this.chartOptionsCount = {
      legend: { display: false },
      scales: {
        yAxes: [
          {
            display: true,
            ticks: {
              stepSize: Math.round(max2 / this.stepSize),
              suggestedMin: 0, // minimum will be 0, unless there is a lower value.
              // OR //
              beginAtZero: true, // minimum value will be 0.
            },
          },
        ],
      },
    };
  }
}
