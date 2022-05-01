import { Component, OnInit } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';

import { GLOBAL } from '@data/constants/global';
import { PortfolioControlService } from '@data/services/portfolio-control.service';

import { PlantaInterface } from '@core/models/planta';

interface PlantaChart {
  planta: PlantaInterface;
  anomsGraves: number;
}
@Component({
  selector: 'app-anomalias-graves-chart',
  templateUrl: './anomalias-graves-chart.component.html',
  styleUrls: ['./anomalias-graves-chart.component.css'],
})
export class AnomaliasGravesChartComponent implements OnInit {
  private plantas: PlantaInterface[];
  private anomsGravesChart: PlantaChart[] = [];
  dataAnomsGraves: number[] = [];
  plantasId: string[] = [];
  labels: string[] = [];
  coloresVarMae: string[] = [];

  constructor(private _snackBar: MatSnackBar, private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;

    const anomsGraves = [0.009, 0.091, 0.102, 0.042, 0.078, 0.079, 0.021, 0.056, 0.051, 0.019, 0.039, 0.023, 0.019];

    this.plantas.forEach((planta, index) => {
      const anomsGravesPlanta = anomsGraves[index];
      if (anomsGravesPlanta !== undefined) {
        this.anomsGravesChart.push({ planta, anomsGraves: anomsGravesPlanta });
      }
    });

    // ordenamos de mayor a menor variacion de MAE
    this.anomsGravesChart.sort((a, b) => b.anomsGraves - a.anomsGraves);

    // solo nos quedamos con los datos graves
    this.anomsGravesChart = this.anomsGravesChart.filter((anosGravChart) => anosGravChart.anomsGraves >= 0.05);

    this.anomsGravesChart.forEach((plant) => {
      this.dataAnomsGraves.push(plant.anomsGraves * 100);
      this.plantasId.push(plant.planta.id);
      // this.informesRecientes.push(plant.informeReciente);
      this.labels.push(plant.planta.nombre);
      this.coloresVarMae.push(GLOBAL.colores_new_mae[2]);
    });
  }

  onClick(index: number) {
    // if (index !== -1) {
    //   const plantaId = this.plantasId[index];
    //   const tipoPlanta = this.tiposPlantas[index];
    //   const informeReciente = this.informesRecientes[index];
    //   if (!this.checkFake(plantaId)) {
    //     // comprobamos si es una planta que solo se ve en el informe antiguo
    //     if (this.portfolioControlService.checkPlantaSoloWebAntigua(plantaId)) {
    //       // this.navigateOldReport(informeReciente.id);
    //     } else {
    //       if (tipoPlanta === 'seguidores') {
    //         this.router.navigate(['clients/tracker/' + plantaId]);
    //       } else if (informeReciente.fecha > GLOBAL.newReportsDate || plantaId === 'egF0cbpXnnBnjcrusoeR') {
    //         this.router.navigate(['clients/fixed/' + plantaId]);
    //       } else {
    //         this.openSnackBar();
    //       }
    //     }
    //   } else {
    //     this.openSnackBarDemo();
    //   }
    // }
  }

  chartPositionChange(value: number) {
    // this.chartPosition = value;
  }
}
