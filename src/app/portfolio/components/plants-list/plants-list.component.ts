import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { MatTableDataSource } from '@angular/material/table';

import { GLOBAL } from '@core/services/global';
import { PortfolioControlService } from '@core/services/portfolio-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

interface PlantData {
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
  warnings?: string[];
}

@Component({
  selector: 'app-plants-list',
  templateUrl: './plants-list.component.html',
  styleUrls: ['./plants-list.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class PlantsListComponent implements OnInit {
  displayedColumns: string[] = [
    'nombre',
    'mae',
    'variacionMae',
    'perdidas',
    'variacionPerdidas',
    'ultimaInspeccion',
    'acceso',
  ];
  dataSource = new MatTableDataSource<PlantData>();
  expandedRow: PlantData | null;
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];

  constructor(private portfolioControlService: PortfolioControlService, private router: Router) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;

    const plantsData: PlantData[] = [];

    this.plantas.forEach((planta) => {
      const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
      const informeReciente = informesPlanta.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));
      const informePrevio = informesPlanta
        .filter((informe) => informe.id !== informeReciente.id)
        .reduce((prev, current) => (prev.fecha > current.fecha ? prev : current));
      const variacionMae = informeReciente.mae - informePrevio.mae;
      const perdidasInfReciente = informeReciente.mae * planta.potencia * 1000;
      const perdidasInfPrevio = informePrevio.mae * planta.potencia * 1000;
      const variacionPerdidas = (perdidasInfReciente - perdidasInfPrevio) / perdidasInfPrevio;

      let informesAntiguos: InformeInterface[] = [];
      if (planta.tipo !== 'seguidores' && planta.id !== 'egF0cbpXnnBnjcrusoeR') {
        informesAntiguos = informesPlanta.filter((informe) => informe.fecha < GLOBAL.newReportsDate);
      }

      let plantData: PlantData = {
        nombre: planta.nombre,
        potencia: planta.potencia,
        mae: informeReciente.mae,
        variacionMae,
        gravedadMae: this.getGravedadMae(informeReciente.mae),
        perdidas: perdidasInfReciente,
        variacionPerdidas,
        ultimaInspeccion: informeReciente.fecha,
        plantaId: planta.id,
        tipo: planta.tipo,
        cc: informeReciente.cc,
      };

      plantData = this.addFakeWarnings(plantData);

      plantsData.push(plantData);
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

  private addFakeWarnings(plantsData: PlantData) {
    const warnings: string[] = [];
    if (plantsData.nombre === 'Planta 1') {
      warnings.push('3476 módulos en circuito abierto (string)');
      warnings.push('446 módulos con substring en circuito abierto');
      warnings.push('63% de anomalías en la fila 1 (más alejada del suelo)');

      plantsData.warnings = warnings;
    }
    if (plantsData.nombre === 'Planta 2') {
      warnings.push('587 módulos afectados por sombras');

      plantsData.warnings = warnings;
    }
    if (plantsData.nombre === 'Planta 3') {
      warnings.push('573 módulos en circuito abierto (string)');
      warnings.push('147 módulos con substring en circuito abierto');
      warnings.push('6 módulos con células calientes con gradiente mayor de 40ºC');

      plantsData.warnings = warnings;
    }

    return plantsData;
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
