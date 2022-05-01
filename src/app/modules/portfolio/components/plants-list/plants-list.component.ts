import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';

import { GLOBAL } from '@data/constants/global';
import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { DemoService } from '@data/services/demo.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

export interface PlantData {
  nombre: string;
  potencia: number;
  mae: number;
  variacionMae: number;
  gravedadMae: string;
  perdidas: number;
  variacionPerdidas: number;
  ultimaInspeccion: number;
  cc: number;
  variacionCC: number;
  gravedadCC: string;
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
export class PlantsListComponent implements OnInit, AfterViewInit {
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
  pdfDemo =
    'https://firebasestorage.googleapis.com/v0/b/sdweb-d33ce.appspot.com/o/informes%2F62dvYbGgoMkMNCuNCOEc%2Finforme.pdf?alt=media&token=e7360912-80a4-43eb-bbca-b41868c8a9d6';
  excelDemo =
    'https://firebasestorage.googleapis.com/v0/b/sdweb-d33ce.appspot.com/o/informes%2F62dvYbGgoMkMNCuNCOEc%2Finforme.xlsx?alt=media&token=05aab4b1-452d-4822-8a50-dc788739a620';

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private portfolioControlService: PortfolioControlService,
    private router: Router,
    private demoService: DemoService,
    private _snackBar: MatSnackBar
  ) {}

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
      const variacionCC = informeReciente.cc - informePrevio.cc;
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
        gravedadMae: this.portfolioControlService.getGravedadMae(informeReciente.mae),
        perdidas: perdidasInfReciente,
        variacionPerdidas,
        ultimaInspeccion: informeReciente.fecha,
        plantaId: planta.id,
        tipo: planta.tipo,
        cc: informeReciente.cc,
        variacionCC,
        gravedadCC: this.portfolioControlService.getGravedadCC(informeReciente.cc),
      };

      plantData = this.demoService.addFakeWarnings(plantData);

      plantsData.push(plantData);
    });

    this.dataSource.data = plantsData;
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  hoverPlanta(row) {
    this.portfolioControlService.plantaHovered = this.plantas.find((planta) => planta.id === row.plantaId);
    // this.portfolioControlService.setExternalStyle(row.plantaId, true);
  }

  unhoverPlanta(row) {
    this.portfolioControlService.plantaHovered = undefined;
    // this.portfolioControlService.setExternalStyle(row.plantaId, false);
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

  private checkFake(plantaId: string): boolean {
    const fakeIds = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    if (fakeIds.includes(plantaId)) {
      return true;
    } else {
      return false;
    }
  }

  private navegateNewReport(row: any) {
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

  private navigateOldReport(informeId: string) {
    this.router.navigate(['clientes/informe-view/' + informeId + '/informe-overview']);
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

  navegateToReport(row: any) {
    if (row.tipo === 'seguidores') {
      this.router.navigate(['clients/tracker/' + row.plantaId]);
    } else {
      this.router.navigate(['clients/fixed/' + row.plantaId]);
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }
}
