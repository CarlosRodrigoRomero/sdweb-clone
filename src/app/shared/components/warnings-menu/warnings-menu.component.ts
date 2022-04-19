import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { switchMap, take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { SeguidorService } from '@core/services/seguidor.service';
import { FilterService } from '@core/services/filter.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { LocationFilter } from '@core/models/locationFilter';
import { LocationAreaInterface } from '@core/models/location';

interface Warning {
  type: string;
  content: string;
  action: string;
}

@Component({
  selector: 'app-warnings-menu',
  templateUrl: './warnings-menu.component.html',
  styleUrls: ['./warnings-menu.component.css'],
})
export class WarningsMenuComponent implements OnInit, OnDestroy {
  warnings: Warning[] = [];
  private allAnomalias: Anomalia[] = [];
  private selectedInforme: InformeInterface;
  private anomaliasInforme: Anomalia[] = [];
  private planta: PlantaInterface;
  private locAreas: LocationAreaInterface[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private router: Router,
    private seguidorService: SeguidorService,
    private filterService: FilterService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.allFilterableElements$
        .pipe(
          switchMap((elems) => {
            if (this.reportControlService.plantaFija) {
              this.allAnomalias = elems as Anomalia[];
            } else {
              (elems as Seguidor[]).forEach((seg) => this.allAnomalias.push(...seg.anomaliasCliente));
            }

            return combineLatest([
              this.informeService.getInformesDePlanta(this.reportControlService.plantaId),
              this.reportControlService.selectedInformeId$,
              this.plantaService.getPlanta(this.reportControlService.plantaId),
              this.plantaService.getLocationsArea(this.reportControlService.plantaId),
            ]);
          })
        )
        .subscribe(([informes, informeId, planta, locAreas]) => {
          this.planta = planta;
          this.locAreas = locAreas;

          this.selectedInforme = informes.find((informe) => informe.id === informeId);

          this.anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === informeId);

          if (this.selectedInforme !== undefined && this.anomaliasInforme.length > 0) {
            // reseteamos warnings con cada actualización
            this.warnings = [];

            this.checkWanings();
          }
        })
    );
  }

  private checkWanings() {
    this.checkTiposAnoms();
    this.checkNumsCoA();
    this.checkNumsCriticidad();
    this.checkFilsColsPlanta();
    this.checkZonesWarnings();
    this.checkFilColAnoms();
  }

  fixProblem(type: string) {
    const urlPlantaEdit = this.router.serializeUrl(this.router.createUrlTree(['admin/plants/edit/' + this.planta.id]));
    const urlLocalizaciones = this.router.serializeUrl(
      this.router.createUrlTree(['clientes/auto-loc/' + this.planta.id])
    );

    switch (type) {
      case 'tiposAnom':
        this.reportControlService.setTiposAnomInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
      case 'numsCoA':
        this.reportControlService.setNumAnomsCoAInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
      case 'numsCriticidad':
        this.reportControlService.setNumAnomsCritInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
      case 'filsColsPlanta':
        window.open(urlPlantaEdit, '_blank');
        break;
      case 'zonasPlanta':
        window.open(urlLocalizaciones, '_blank');
        break;
      case 'nombresZonas':
        window.open(urlPlantaEdit, '_blank');
        break;
      case 'filsColsAnoms':
        const filColFilter: LocationFilter = new LocationFilter('location', this.planta.filas, this.planta.columnas);
        this.filterService.addFilter(filColFilter);
        break;
      case 'modulosPlanta':
        window.open(urlLocalizaciones, '_blank');
        break;
      case 'modulosAnoms':
        this.fixModulosAnoms();
        break;
    }
  }

  private checkTiposAnoms() {
    if (this.selectedInforme !== undefined && this.anomaliasInforme.length > 0) {
      const sumTiposAnoms = this.selectedInforme.tiposAnomalias.reduce((acum, curr, index) => {
        // las celulas calientes son un array por separado
        if (index === 8 || index === 9) {
          return acum + curr.reduce((a, c) => a + c);
        } else {
          return acum + curr;
        }
      });

      if (this.anomaliasInforme.length !== sumTiposAnoms) {
        this.warnings.push({
          content: 'El nº de anomalías no coincide con la suma de los tipos de anomalías',
          type: 'tiposAnom',
          action: 'Corregir',
        });
      }
    }
  }

  private checkNumsCoA() {
    if (this.selectedInforme !== undefined && this.anomaliasInforme.length > 0) {
      const sumNumsCoA = this.selectedInforme.numsCoA.reduce((acum, curr) => acum + curr);

      if (this.anomaliasInforme.length !== sumNumsCoA) {
        this.warnings.push({
          content: 'El nº de anomalías no coincide con la suma de los CoA',
          type: 'numsCoA',
          action: 'Corregir',
        });
      }
    }
  }

  private checkNumsCriticidad() {
    if (this.selectedInforme !== undefined && this.anomaliasInforme.length > 0) {
      const sumNumsCriticidad = this.selectedInforme.numsCriticidad.reduce((acum, curr) => acum + curr);

      if (this.anomaliasInforme.length !== sumNumsCriticidad) {
        this.warnings.push({
          content: 'El nº de anomalías no coincide con la suma de las anomalías por criticidad',
          type: 'numsCriticidad',
          action: 'Corregir',
        });
      }
    }
  }

  private checkFilsColsPlanta() {
    if (this.planta.columnas <= 1 || this.planta.columnas === undefined || this.planta.columnas === null) {
      if (this.reportControlService.plantaFija) {
        this.warnings.push({
          content: 'El nº de filas y columnas de la planta no son correctos',
          type: 'filsColsPlanta',
          action: 'Ir a Editar planta',
        });
      } else {
        this.warnings.push({
          content: 'El nº de filas y columnas de la planta no son correctos y por tanto MAE y CC están mal',
          type: 'filsColsPlanta',
          action: 'Ir a Editar planta',
        });
      }
    }
  }

  private checkZonesWarnings() {
    let hasZones = false;
    if (this.reportControlService.plantaFija) {
      if (this.reportControlService.numFixedGlobalCoords >= 1) {
        hasZones = true;
      }
    } else {
      if (this.seguidorService.numGlobalCoords >= 1) {
        hasZones = true;
      }
    }

    if (hasZones) {
      this.checkZonesNames();

      this.checkModulosWarnings();
    } else {
      // añadimos el aviso de que faltan las zonas de la planta
      this.warnings.push({
        content: 'Faltan las zonas de la planta',
        type: 'zonasPlanta',
        action: 'Ir a Localizaciones',
      });
    }
  }

  private checkModulosWarnings() {
    const areasConModulo = this.locAreas.filter(
      (locArea) => locArea.hasOwnProperty('modulo') && locArea.modulo !== null && locArea.modulo !== undefined
    );

    if (areasConModulo.length > 0) {
      this.checkModulosAnoms();
    } else {
      // añadimos el aviso de que faltan los modulos de la planta
      this.warnings.push({
        content: 'Faltan los módulos de la planta',
        type: 'modulosPlanta',
        action: 'Ir a Localizaciones',
      });
    }
  }

  private checkZonesNames() {
    if (
      !this.planta.hasOwnProperty('nombreGlobalCoords') ||
      this.planta.nombreGlobalCoords === null ||
      this.planta.nombreGlobalCoords === undefined ||
      this.planta.nombreGlobalCoords.length === 0
    ) {
      this.warnings.push({
        content: 'Faltan los nombres de las zonas de la planta',
        type: 'nombresZonas',
        action: 'Ir a Editar planta',
      });
    }
  }

  private checkFilColAnoms() {
    // primero comprobamos que el nº de filas y columnas de la planta sean correctos
    if (this.planta.columnas > 1 && this.planta.columnas !== undefined && this.planta.columnas !== null) {
      const differentFilColAnoms = this.anomaliasInforme.filter(
        (anom) => anom.localY > this.planta.filas || anom.localX > this.planta.columnas
      );

      if (differentFilColAnoms.length > 0) {
        this.warnings.push({
          content: 'Hay posibles anomalías con datos de fila y columna erroneos',
          type: 'filsColsAnoms',
          action: 'Filtrar',
        });
      }
    }
  }

  private checkModulosAnoms() {
    const anomsSinModulo = this.anomaliasInforme.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    if (anomsSinModulo.length > 0) {
      this.warnings.push({
        content: `Hay ${anomsSinModulo.length} anomalías sin módulo`,
        type: 'modulosAnoms',
        action: 'Corregir',
      });
    }
  }

  private fixModulosAnoms() {
    const anomsSinModulo = this.anomaliasInforme.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    anomsSinModulo.forEach((anom) => {
      const modulo = this.anomaliaService.getModule(anom.featureCoords[0], this.locAreas);

      if (modulo !== null) {
        anom.modulo = modulo;

        this.anomaliaService.updateAnomaliaField(anom.id, 'modulo', modulo);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
