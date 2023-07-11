import { Component, OnInit } from '@angular/core';

import { PortfolioControlService } from '@data/services/portfolio-control.service';

import { Notification } from '@core/models/notification';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-portfolio-notifications',
  templateUrl: './portfolio-notifications.component.html',
  styleUrls: ['./portfolio-notifications.component.css'],
})
export class PortfolioNotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {
    const plantas = this.portfolioControlService.listaPlantas;
    const informes = this.portfolioControlService.listaInformes;

    const pidsPlants: PlantaInterface[] = [];
    const maeGravePlants: PlantaInterface[] = [];
    const degradacionPlants: PlantaInterface[] = [];
    plantas.forEach((planta) => {
      const informesPlanta = informes.filter((inf) => inf.plantaId === planta.id);

      let informesRecientes: InformeInterface[];
      if (informesPlanta.length > 1) {
        // si hay más de un informe obtenemos los 2 informes más recientes
        informesRecientes = informesPlanta.sort((a, b) => (a.fecha > b.fecha ? -1 : 1)).slice(0, 2);
      } else {
        informesRecientes = informesPlanta;
      }

      // checkeamos la aparición de PID
      if (this.checkPidNotification(informesRecientes[0])) {
        pidsPlants.push(planta);
      }

      // checkeamos el MAE grave
      if (this.checkMaeGraveNotification(informesRecientes[0])) {
        maeGravePlants.push(planta);
      }
    });

    this.notifications = [
      {
        content: 'Ha aparecido PID en las siguientes plantas',
        plants: pidsPlants,
      },
      {
        content: 'Las siguientes plantas tienen un MAE grave',
        plants: maeGravePlants,
      },
      {
        content: 'Las siguientes plantas han tenido una alta degradación',
        plants: degradacionPlants,
      },
    ];
  }

  applyFilter(index: number) {
    this.portfolioControlService.filteredPlants = this.portfolioControlService.listaPlantas.filter((planta) =>
      this.notifications[index].plants.map((p) => p.id).includes(planta.id)
    );
  }

  private checkPidNotification(informe: InformeInterface): boolean {
    if (informe.hasOwnProperty('tiposAnomalias') && informe.tiposAnomalias.length > 0) {
      const numPids = informe.tiposAnomalias[18] + informe.tiposAnomalias[20] + informe.tiposAnomalias[21];

      if (numPids > 0) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  private checkMaeGraveNotification(informe: InformeInterface): boolean {
    if (informe.mae >= 0.01) {
      return true;
    } else {
      return false;
    }
  }
}
