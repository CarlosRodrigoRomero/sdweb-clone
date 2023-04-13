import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AuthService } from '@data/services/auth.service';
import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { GLOBAL } from '@data/constants/global';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

interface PlantsData {
  nombre: string;
  potencia: number;
  mae: number;
  powerLoss: number;
  fixedPowerLoss: number;
  ultimaInspeccion: number;
  informesAntiguos: InformeInterface[];
  plantaId: string;
  tipo: string;
  color: string;
}

@Component({
  selector: 'app-plant-list',
  templateUrl: './plant-list.component.html',
  styleUrls: ['./plant-list.component.css'],
})
export class PlantListComponent implements OnInit, AfterViewInit {
  public displayedColumns: string[] = [
    'color',
    'nombre',
    'potencia',
    'mae',
    'powerLoss',
    'fixedPowerLoss',
    'tipo',
    'ultimaInspeccion',
    'inspeccionesAntiguas',
  ];
  public dataSource = new MatTableDataSource<PlantsData>();
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public auth: AuthService,
    private portfolioControlService: PortfolioControlService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;

    const plantsData = [];

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
        powerLoss: planta.potencia * informeReciente.mae,
        fixedPowerLoss: informeReciente.fixedPowerLoss * planta.potencia,
        ultimaInspeccion: informeReciente.fecha,
        informesAntiguos,
        plantaId: planta.id,
        tipo: planta.tipo,
        informeReciente,
        color: this.portfolioControlService.getColorMae(informeReciente.mae),
      });
    });

    this.dataSource.data = plantsData;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  onClick(row: any) {
    if (!this.checkFake(row.plantaId)) {
      // comprobamos si es una planta que solo se ve en el informe antiguo
      if (this.portfolioControlService.checkPlantaSoloWebAntigua(row.plantaId)) {
        this.navigateOldReport(row.informeReciente.id);
      } else {
        this.navegateNewReport(row);
      }
    } else {
      this.openSnackBarDemo();
    }
  }

  navegateNewReport(row: any) {
    // provisional - no abre ningun informe de fijas anterior al 1/05/2021 salvo DEMO
    if (row.tipo === 'seguidores') {
      this.router.navigate(['clients/tracker/' + row.plantaId]);
    } else {
      if (row.ultimaInspeccion > GLOBAL.newReportsDate || row.plantaId === 'egF0cbpXnnBnjcrusoeR') {
        this.router.navigate(['clients/fixed/' + row.plantaId]);
      } else {
        this.openSnackBar();
      }
    }
  }

  navigateOldReport(informeId: string) {
    this.router.navigate(['clientes/informe-view/' + informeId + '/informe-overview']);
  }

  private checkFake(plantaId: string): boolean {
    const fakeIds = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    if (fakeIds.includes(plantaId)) {
      return true;
    } else {
      return false;
    }
  }

  private openSnackBar() {
    this._snackBar.open('Acceda a inspecciones antiguas a la derecha en la tabla', '', {
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

  hoverPlanta(row) {
    this.portfolioControlService.plantaHovered = this.plantas.find((planta) => planta.id === row.plantaId);
  }

  unhoverPlanta(row) {
    this.portfolioControlService.plantaHovered = undefined;
  }
}
