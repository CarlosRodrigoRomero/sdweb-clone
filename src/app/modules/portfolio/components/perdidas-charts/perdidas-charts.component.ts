import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { GLOBAL } from '@data/constants/global';
import { PortfolioControlService } from '@data/services/portfolio-control.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { COLOR } from '@data/constants/color';

interface PlantaChart {
  planta: PlantaInterface;
  perdidas: number;
  variacionPerdidas: number;
}

@Component({
  selector: 'app-perdidas-charts',
  templateUrl: './perdidas-charts.component.html',
  styleUrls: ['./perdidas-charts.component.css'],
})
export class PerdidasChartsComponent implements OnInit {
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private maePlantas: number[] = [];
  private perdidasChart: PlantaChart[] = [];
  public dataPerdidas = Array<number>();
  public dataVarPerdidas = Array<number>();
  public plantasId: string[] = [];
  public tiposPlantas: string[] = [];
  private informesRecientes: InformeInterface[] = [];
  public labels = Array<string>();
  public coloresPerdidas = Array<string>();
  public coloresVarPerdidas = Array<string>();
  private chartPosition = 0;

  constructor(
    private _snackBar: MatSnackBar,
    private portfolioControlService: PortfolioControlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;
    this.maePlantas = this.portfolioControlService.maePlantas;

    this.plantas.forEach((planta, index) => {
      const perdidasInfActual = this.maePlantas[index] * planta.potencia;
      if (perdidasInfActual !== undefined) {
        // obtenemos los 2 ultimos informes para obtener los datos
        const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
        const informeReciente = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));
        const informePrevio = informesPlanta
          .filter((informe) => informe.id !== informeReciente.id)
          .reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));
        const perdidasInfPrevio = informePrevio.mae * planta.potencia;

        const variacionPerdidas = (perdidasInfActual - perdidasInfPrevio) / perdidasInfPrevio;

        this.perdidasChart.push({ planta, perdidas: perdidasInfActual, variacionPerdidas });
      }
    });

    this.perdidasChart.sort((a, b) => b.variacionPerdidas - a.variacionPerdidas);

    this.perdidasChart.forEach((plant) => {
      this.dataPerdidas.push(plant.perdidas * 1000);
      this.dataVarPerdidas.push(plant.variacionPerdidas * 100);
      this.plantasId.push(plant.planta.id);
      // this.informesRecientes.push(plant.informeReciente);
      this.labels.push(plant.planta.nombre);
      this.coloresPerdidas.push(this.getColorPerdidas(plant.perdidas));
      this.coloresVarPerdidas.push(this.getColorVarPerdidas(plant.variacionPerdidas));
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
    this.chartPosition = value;
  }

  private getColorPerdidas(perdidas: number) {
    let colorPerdidas = '';
    if (perdidas >= 0.2) {
      colorPerdidas = COLOR.colores_severity[2];
    } else if (perdidas <= 0.1) {
      colorPerdidas = COLOR.colores_severity[0];
    } else {
      colorPerdidas = COLOR.colores_severity[1];
    }

    return colorPerdidas;
  }

  private getColorVarPerdidas(varPerdidas: number) {
    let colorPerdidas = '';
    if (varPerdidas >= 1) {
      colorPerdidas = COLOR.colores_severity[2];
    } else if (varPerdidas <= 0) {
      colorPerdidas = COLOR.colores_severity[0];
    } else {
      colorPerdidas = COLOR.colores_severity[1];
    }

    return colorPerdidas;
  }

  private openSnackBar() {
    this._snackBar.open('Planta en mantenimiento temporalmente', 'OK', {
      duration: 5000,
      verticalPosition: 'top',
    });
  }

  private openSnackBarDemo() {
    this._snackBar.open('Planta sin contenido. Acceda a "Demo 1"', '', {
      duration: 5000,
      verticalPosition: 'top',
    });
  }

  private checkFake(plantaId: string): boolean {
    const fakeIds = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    if (fakeIds.includes(plantaId)) {
      return true;
    } else {
      return false;
    }
  }
}
