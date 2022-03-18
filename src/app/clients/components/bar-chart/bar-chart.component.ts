import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { GLOBAL } from '@core/services/global';
import { AuthService } from '@core/services/auth.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { fromLonLat } from 'ol/proj';

interface PlantaChart {
  planta: PlantaInterface;
  informeReciente: InformeInterface;
  mae: number;
}
@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css'],
})
export class BarChartComponent implements OnInit {
  public barChartLabels = Array<string>();
  public data = Array<number>();
  public coloresChart = Array<string>();
  private maePlantas: number[] = [];
  public maeMedio: number;
  private maeSigma: number;
  public plantasId: string[] = [];
  public tiposPlantas: string[] = [];
  public plantas: PlantaInterface[];
  private informes: InformeInterface[];
  private informesRecientes: InformeInterface[] = [];
  private plantasChart: PlantaChart[] = [];

  constructor(
    public auth: AuthService,
    private portfolioControlService: PortfolioControlService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;
    this.maePlantas = this.portfolioControlService.maePlantas;
    this.maeMedio = this.portfolioControlService.maeMedio;
    this.maeSigma = this.portfolioControlService.maeSigma;

    this.plantas.forEach((planta, index) => {
      const mae = this.maePlantas[index];
      if (mae !== undefined) {
        // obtenemos el informe mas reciente de la planta para usar su fecha
        const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
        const informeReciente = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));

        this.plantasChart.push({ planta, informeReciente, mae });
      }
    });

    this.plantasChart.sort((a, b) => b.mae - a.mae);

    this.plantasChart.forEach((plant) => {
      this.data.push(plant.mae * 100);
      this.plantasId.push(plant.planta.id);
      this.tiposPlantas.push(plant.planta.tipo);
      this.informesRecientes.push(plant.informeReciente);
      this.barChartLabels.push(plant.planta.nombre);
      this.coloresChart.push(this.portfolioControlService.getColorMae(plant.mae));
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
          this.navigateOldReport(informeReciente.id);
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

  onHover(index: number) {
    if (index !== -1) {
      const planta = this.plantas[index];

      this.portfolioControlService.plantaHovered = planta;
    } else {
      this.portfolioControlService.setPopupPosition(undefined);
    }
  }

  private navigateOldReport(informeId: string) {
    this.router.navigate(['clientes/informe-view/' + informeId + '/informe-overview']);
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
