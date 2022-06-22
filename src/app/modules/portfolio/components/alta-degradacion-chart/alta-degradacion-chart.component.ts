import { Component, OnInit } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';

import { PortfolioControlService } from '@data/services/portfolio-control.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

import { COLOR } from '@data/constants/color';

interface PlantaChart {
  planta: PlantaInterface;
  mae: number;
  variacionMae: number;
}
@Component({
  selector: 'app-alta-degradacion-chart',
  templateUrl: './alta-degradacion-chart.component.html',
  styleUrls: ['./alta-degradacion-chart.component.css'],
})
export class AltaDegradacionChartComponent implements OnInit {
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private maePlantas: number[] = [];
  private maesChart: PlantaChart[] = [];
  dataVarMae: number[] = [];
  plantasId: string[] = [];
  labels: string[] = [];
  coloresVarMae: string[] = [];

  constructor(private _snackBar: MatSnackBar, private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;
    this.maePlantas = this.portfolioControlService.maePlantas;

    this.plantas.forEach((planta, index) => {
      const mae = this.maePlantas[index];
      if (mae !== undefined) {
        // obtenemos los 2 ultimos informes para obtener los datos
        const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
        const informeReciente = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));
        const informePrevio = informesPlanta
          .filter((informe) => informe.id !== informeReciente.id)
          .reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));
        const variacionMae = mae - informePrevio.mae;

        this.maesChart.push({ planta, mae, variacionMae });
      }
    });

    // ordenamos de mayor a menor variacion de MAE
    this.maesChart.sort((a, b) => b.variacionMae - a.variacionMae);

    // solo nos quedamos con los datos graves
    this.maesChart = this.maesChart.filter((maeChart) => maeChart.variacionMae >= 0.02);

    this.maesChart.forEach((plant) => {
      this.dataVarMae.push(plant.variacionMae * 100);
      this.plantasId.push(plant.planta.id);
      // this.informesRecientes.push(plant.informeReciente);
      this.labels.push(plant.planta.nombre);
      this.coloresVarMae.push(COLOR.colores_severity[2]);
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
