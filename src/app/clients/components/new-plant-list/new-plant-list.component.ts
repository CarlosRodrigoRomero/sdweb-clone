import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { MatTableDataSource } from '@angular/material/table';

import { GLOBAL } from '@core/services/global';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

interface PlantsData {
  nombre: string;
  potencia: number;
  mae: number;
  variacionMae: number;
  gravedadMae: string;
  perdidas: number;
  variacionPerdidas: number;
  ultimaInspeccion: number;
  cc: number;
  informesAntiguos?: InformeInterface[];
  plantaId?: string;
  tipo?: string;
}

@Component({
  selector: 'app-new-plant-list',
  templateUrl: './new-plant-list.component.html',
  styleUrls: ['./new-plant-list.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class NewPlantListComponent implements OnInit {
  displayedColumns: string[] = [
    'nombre',
    'mae',
    'variacionMae',
    'perdidas',
    'variacionPerdidas',
    'ultimaInspeccion',
    'acceso',
  ];
  dataSource = new MatTableDataSource<PlantsData>();
  expandedRow: PlantsData | null;
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];

  constructor(private portfolioControlService: PortfolioControlService, private router: Router) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;

    const plantsData: PlantsData[] = [];

    this.plantas.forEach((planta) => {
      const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
      const informeReciente = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));

      let informesAntiguos: InformeInterface[] = [];
      if (planta.tipo !== 'seguidores' && planta.id !== 'egF0cbpXnnBnjcrusoeR') {
        informesAntiguos = informesPlanta.filter((informe) => informe.fecha < GLOBAL.newReportsDate);
      }

      plantsData.push({
        nombre: planta.nombre,
        potencia: planta.potencia,
        mae: informeReciente.mae,
        variacionMae: 0,
        gravedadMae: this.getGravedadMae(informeReciente.mae),
        perdidas: informeReciente.mae * planta.potencia * 1000,
        variacionPerdidas: 0,
        ultimaInspeccion: informeReciente.fecha,
        plantaId: planta.id,
        tipo: planta.tipo,
        cc: informeReciente.cc,
      });
    });

    this.dataSource.data = plantsData;
  }

  private getGravedadMae(mae: number) {
    let gravedad = GLOBAL.mae_rangos_labels[0];
    GLOBAL.mae_rangos.forEach((rango, index) => {
      if (mae > rango) {
        gravedad = GLOBAL.mae_rangos_labels[index + 1];
      }
    });

    return gravedad;
  }

  hoverPlanta(row) {
    this.portfolioControlService.plantaHovered = this.plantas.find((planta) => planta.id === row.plantaId);
    // this.portfolioControlService.setExternalStyle(row.plantaId, true);
  }

  unhoverPlanta(row) {
    this.portfolioControlService.plantaHovered = undefined;
    // this.portfolioControlService.setExternalStyle(row.plantaId, false);
  }

  navegateToReport(row: any) {
    if (row.tipo === 'seguidores') {
      this.router.navigate(['clients/tracker/' + row.plantaId]);
    } else {
      this.router.navigate(['clients/fixed/' + row.plantaId]);
    }
  }
}
