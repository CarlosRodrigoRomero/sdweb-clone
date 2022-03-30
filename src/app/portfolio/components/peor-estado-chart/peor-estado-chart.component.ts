import { Component, OnInit } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';

import { GLOBAL } from '@core/services/global';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

interface PlantaChart {
  planta: PlantaInterface;
  mae: number;
}
@Component({
  selector: 'app-peor-estado-chart',
  templateUrl: './peor-estado-chart.component.html',
  styleUrls: ['./peor-estado-chart.component.css'],
})
export class PeorEstadoChartComponent implements OnInit {
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private maePlantas: number[] = [];
  private maesChart: PlantaChart[] = [];
  dataMae: number[] = [];
  plantasId: string[] = [];
  labels: string[] = [];
  coloresMae: string[] = [];

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

        this.maesChart.push({ planta, mae });
      }
    });

    // ordenamos de mayor a menor MAE
    this.maesChart.sort((a, b) => b.mae - a.mae);

    // solo nos quedamos con los datos graves
    this.maesChart = this.maesChart.filter(
      (maeChart) => maeChart.mae >= this.portfolioControlService.maeMedio + this.portfolioControlService.maeSigma
    );

    this.maesChart.forEach((plant) => {
      this.dataMae.push(plant.mae * 100);
      this.plantasId.push(plant.planta.id);
      this.labels.push(plant.planta.nombre);
      this.coloresMae.push(GLOBAL.colores_new_mae[2]);
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
