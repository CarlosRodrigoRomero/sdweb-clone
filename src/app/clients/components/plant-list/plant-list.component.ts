import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AuthService } from '@core/services/auth.service';
import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

interface PlantsData {
  nombre: string;
  potencia: number;
  mae: number;
  ultimaInspeccion: number;
  plantaId: string;
}

@Component({
  selector: 'app-plant-list',
  templateUrl: './plant-list.component.html',
  styleUrls: ['./plant-list.component.css'],
})
export class PlantListComponent implements OnInit, AfterViewInit {
  public displayedColumns: string[] = ['nombre', 'potencia', 'mae', 'ultimaInspeccion', 'compartir'];
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

      plantsData.push({
        nombre: planta.nombre,
        potencia: planta.potencia,
        mae: informeReciente.mae,
        ultimaInspeccion: informeReciente.fecha,
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

    // provisional - no abre ningun informe de fijas anterior al 1/05/2021 salvo DEMO
    if (tipoPlanta === 'seguidores') {
      this.router.navigate(['clients/tracker/' + plantaId]);
    } else {
      if (fecha > 1619820000 || plantaId === 'egF0cbpXnnBnjcrusoeR') {
        this.router.navigate(['clients/fixed/' + plantaId]);
      } else {
        this.openSnackBar();
      }
    }
  }

  private openSnackBar() {
    this._snackBar.open('Planta en mantenimiento temporalmente', 'OK', {
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
