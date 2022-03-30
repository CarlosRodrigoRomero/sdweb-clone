import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { GLOBAL } from '@core/services/global';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

interface PlantaChart {
  planta: PlantaInterface;
  mae: number;
  variacionMae: number;
}
@Component({
  selector: 'app-mae-charts',
  templateUrl: './mae-charts.component.html',
  styleUrls: ['./mae-charts.component.css'],
})
export class MaeChartsComponent implements OnInit {
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private maePlantas: number[] = [];
  private maesChart: PlantaChart[] = [];
  dataMae: number[] = [];
  dataVarMae: number[] = [];
  plantasId: string[] = [];
  tiposPlantas: string[] = [];
  private informesRecientes: InformeInterface[] = [];
  labels: string[] = [];
  coloresMae: string[] = [];
  coloresVarMae: string[] = [];
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

    this.maesChart.sort((a, b) => b.variacionMae - a.variacionMae);

    this.maesChart.forEach((plant) => {
      this.dataMae.push(plant.mae * 100);
      this.dataVarMae.push(plant.variacionMae * 100);
      this.plantasId.push(plant.planta.id);
      // this.informesRecientes.push(plant.informeReciente);
      this.labels.push(plant.planta.nombre);
      this.coloresMae.push(this.portfolioControlService.getNewColorMae(plant.mae));
      this.coloresVarMae.push(this.getColorVarMae(plant.variacionMae));
    });
  }

  onClick(index: number) {
    if (index !== -1) {
      const plantaId = this.plantasId[index];
      const tipoPlanta = this.tiposPlantas[index];
      const informeReciente = this.informesRecientes[index];

      if (!this.checkFake(plantaId)) {
        // comprobamos si es una planta que solo se ve en el informe antiguo
        if (this.portfolioControlService.checkPlantaSoloWebAntigua(plantaId)) {
          // this.navigateOldReport(informeReciente.id);
        } else {
          if (tipoPlanta === 'seguidores') {
            this.router.navigate(['clients/tracker/' + plantaId]);
          } else if (informeReciente.fecha > GLOBAL.newReportsDate || plantaId === 'egF0cbpXnnBnjcrusoeR') {
            this.router.navigate(['clients/fixed/' + plantaId]);
          } else {
            this.openSnackBar();
          }
        }
      } else {
        this.openSnackBarDemo();
      }
    }
  }

  chartPositionChange(value: number) {
    this.chartPosition = value;
  }

  private getColorVarMae(varMae: number) {
    let colorMae = '';
    if (varMae >= 0.02) {
      colorMae = GLOBAL.colores_new_mae[2];
    } else if (varMae <= 0) {
      colorMae = GLOBAL.colores_new_mae[0];
    } else {
      colorMae = GLOBAL.colores_new_mae[1];
    }

    return colorMae;
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
