import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { OverlayContainer } from '@angular/cdk/overlay';

import { Subscription } from 'rxjs';

import { PortfolioControlService } from '@data/services/portfolio-control.service';
import { ThemeService } from '@data/services/theme.service';
import { ShareReportService } from '@data/services/share-report.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

import { GLOBAL } from '@data/constants/global';
import { ParamsFilterShare } from '@core/models/paramsFilterShare';

interface PlantsData {
  nombre: string;
  potencia: number;
  mae: number;
  powerLoss: number;
  fixablePower: number;
  ultimaInspeccion: number;
  informesAntiguos: InformeInterface[];
  plantaId: string;
  tipo: string;
  // color: string;
}

@Component({
  selector: 'app-plant-list',
  templateUrl: './plant-list.component.html',
  styleUrls: ['./plant-list.component.css'],
})
export class PlantListComponent implements OnInit, AfterViewInit {
  public displayedColumns: string[] = [
    // 'color',
    'nombre',
    'potencia',
    'mae',
    // 'powerLoss',
    // 'fixablePower',
    // 'inspeccionesAntiguas',
  ];
  public dataSource = new MatTableDataSource<PlantsData>();
  private plantas: PlantaInterface[];
  private informes: InformeInterface[];
  sortedColumn = 'fixablePower';
  theme: string;
  private screenWidth: number;
  btnShowAll = false;

  private subscriptions: Subscription = new Subscription();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private portfolioControlService: PortfolioControlService,
    private router: Router,
    private _snackBar: MatSnackBar,
    private themeService: ThemeService,
    private overlayContainer: OverlayContainer,
    private shareReportService: ShareReportService,
    private changeDetectorRefs: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.screenWidth = window.innerWidth;

    this.plantas = this.portfolioControlService.listaPlantas;
    this.informes = this.portfolioControlService.listaInformes;
    let plantsData = [];

    this.subscriptions.add(
      this.portfolioControlService.filteredPlants$.subscribe((plantas) => {
        plantsData = [];

        // checkeamos si se están mostrando todas para activar el boton de mostrarlas
        if (plantas.length < this.plantas.length) {
          this.btnShowAll = true;
        } else {
          this.btnShowAll = false;
        }

        plantas.forEach((planta) => {
          const informesPlanta = this.informes.filter((informe) => informe.plantaId === planta.id);
          const informeReciente = informesPlanta.reduce((prev, current) =>
            prev.fecha > current.fecha ? prev : current
          );

          let informesAntiguos: InformeInterface[] = [];
          if (planta.tipo !== 'seguidores' && planta.id !== 'egF0cbpXnnBnjcrusoeR') {
            informesAntiguos = informesPlanta.filter((informe) => informe.fecha < GLOBAL.newReportsDate);
          }

          plantsData.push({
            nombre: planta.nombre,
            potencia: planta.potencia,
            mae: informeReciente.mae,
            powerLoss: planta.potencia * informeReciente.mae,
            fixablePower: informeReciente.fixablePower,
            ultimaInspeccion: informeReciente.fecha,
            informesAntiguos,
            plantaId: planta.id,
            tipo: planta.tipo,
            informeReciente,
            // color: this.portfolioControlService.getColorMae(informeReciente.mae),
          });
        });

        this.dataSource.data = plantsData;
        this.changeDetectorRefs.detectChanges();
      })
    );

    this.checkFixableMae(plantsData);

    this.addOtherColumns();

    this.checkOldReports(plantsData);

    this.dataSource.data = plantsData;

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        this.theme = theme;

        this.changeTheme();
      })
    );
  }

  private changeTheme() {
    const overlayContainer = this.overlayContainer.getContainerElement();
    if (this.theme === 'dark-theme') {
      document.body.classList.add('dark-theme');
      overlayContainer.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
      overlayContainer.classList.remove('dark-theme');
    }
  }

  private getFixablePower(informe: InformeInterface, planta: PlantaInterface) {
    if (informe.fixablePower) {
      return informe.fixablePower * planta.potencia;
    } else {
      return null;
    }
  }

  private addOtherColumns() {
    this.displayedColumns.push('tipo');
    this.displayedColumns.push('ultimaInspeccion');
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private checkFixableMae(plantsData: PlantsData[]) {
    if (plantsData.filter((data) => data.fixablePower).length > 0) {
      this.displayedColumns.push('fixablePower');
    }
  }

  private checkOldReports(plantsData: PlantsData[]) {
    if (plantsData.filter((data) => data.informesAntiguos.length > 0).length > 0) {
      this.displayedColumns.push('inspeccionesAntiguas');
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  showAll() {
    this.portfolioControlService.filteredPlants = this.plantas;
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  async onClick(row: any) {
    if (this.screenWidth <= 600) {
      await this.setMobileReportId(row);

      const id = this.shareReportService.getParamsDbId();

      this.navigateMobileReport(row, id);
    } else {
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
  }

  navegateNewReport(row: any) {
    let initialLocalView = 'map';
    initialLocalView = this.checkLocalInitialView();

    // provisional - no abre ningun informe de fijas anterior al 1/05/2021 salvo DEMO
    if (row.tipo === 'seguidores') {
      this.router.navigate(['clients/tracker/' + row.plantaId + '/' + initialLocalView]);
    } else {
      if (row.ultimaInspeccion > GLOBAL.newReportsDate || row.plantaId === 'egF0cbpXnnBnjcrusoeR') {
        if (row.tipo === 'cubierta') {
          this.router.navigate(['clients/rooftop/' + row.plantaId + '/' + initialLocalView]);
        } else {
          this.router.navigate(['clients/fixed/' + row.plantaId + '/' + initialLocalView]);
        }
      } else {
        this.openSnackBar();
      }
    }
  }

  private checkLocalInitialView(): string {
    const initialLocalView = localStorage.getItem('initialViewReports');
    if (initialLocalView) {
      return initialLocalView;
    } else {
      return 'map';
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

  private async setMobileReportId(row: any) {
    const params: ParamsFilterShare = {};
    params.informeId = row.informeReciente.id;
    params.plantaId = row.informeReciente.plantaId;

    await this.shareReportService.saveParams(params);
  }

  private navigateMobileReport(row: any, id: string) {
    // navegamos con window.location.href para forzar la recarga de la pagina porque no funciona el router correctamente
    if (row.tipo === 'seguidores') {
      window.location.href = 'comments-tracker-shared/' + id;
    } else {
      if (row.ultimaInspeccion > GLOBAL.newReportsDate) {
        window.location.href = 'comments-fixed-shared/' + id;
      } else {
        this.openSnackBar();
      }
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

  selectSortColumn(column: string) {
    this.sortedColumn = column;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
