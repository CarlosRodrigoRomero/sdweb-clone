import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AuthService } from '@core/services/auth.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { GLOBAL } from '@core/services/global';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';


interface PlantsData {
  nombre: string;
  potencia: number;
  mae: number;
  ultimaInspeccion: number;
  informesAntiguos: InformeInterface[];
  plantaId: string;
  tipo: string;
}

@Component({
  selector: 'app-plant-list',
  templateUrl: './plant-list.component.html',
  styleUrls: ['./plant-list.component.css'],
})
export class PlantListComponent implements OnInit, AfterViewInit {
  public displayedColumns: string[] = [
    'nombre',
    'potencia',
    'mae',
    'tipo',
    'ultimaInspeccion',
    'inspeccionesAntiguas',
    /* 'compartir', */
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

      let mae: number;
      // los antiguos de fijas los devidimos por 100
      if (planta.tipo !== 'seguidores' && informeReciente.fecha < GLOBAL.newReportsDate && planta.id !== 'egF0cbpXnnBnjcrusoeR') {
        mae = informeReciente.mae / 100;
      } else {
        // el resto añadimos normal
        mae = informeReciente.mae;
      }

      plantsData.push({
        nombre: planta.nombre,
        potencia: planta.potencia,
        mae,
        ultimaInspeccion: informeReciente.fecha,
        informesAntiguos,
        plantaId: planta.id,
        tipo: planta.tipo,
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

  onClick(row) {
    const plantaId = row.plantaId;
    const tipoPlanta = row.tipo;
    const fecha = row.ultimaInspeccion;

    if (!this.checkFake(plantaId)) {
      // provisional - no abre ningun informe de fijas anterior al 1/05/2021 salvo DEMO
      if (tipoPlanta === 'seguidores') {
        this.router.navigate(['clients/tracker/' + plantaId]);
      } else {
        if (fecha > GLOBAL.newReportsDate || plantaId === 'egF0cbpXnnBnjcrusoeR') {
          this.router.navigate(['clients/fixed/' + plantaId]);
        } else {
          this.openSnackBar();
        }
      }
    } else {
      this.openSnackBarDemo();
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
    this.portfolioControlService.plantaHover = this.plantas.find((planta) => planta.id === row.plantaId);
    this.portfolioControlService.setExternalStyle(row.plantaId, true);
  }

  unhoverPlanta(row) {
    this.portfolioControlService.plantaHover = this.plantas.find((planta) => planta.id === row.plantaId);
    this.portfolioControlService.setExternalStyle(row.plantaId, false);
  }
}
