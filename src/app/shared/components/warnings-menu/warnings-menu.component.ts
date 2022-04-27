import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { catchError, switchMap, take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { SeguidorService } from '@core/services/seguidor.service';
import { FilterService } from '@core/services/filter.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PcService } from '@core/services/pc.service';
import { WarningService } from '@core/services/warning.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { LocationFilter } from '@core/models/locationFilter';
import { LocationAreaInterface } from '@core/models/location';
import { WrongGlobalCoordsFilter } from '@core/models/wrongGlobalCoordsFilter';
import { ModuloInterface } from '@core/models/modulo';
import { PcInterface } from '@core/models/pc';
import { Warning } from './warnings';

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
  private allSeguidores: Seguidor[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private router: Router,
    private seguidorService: SeguidorService,
    private filterService: FilterService,
    private anomaliaService: AnomaliaService,
    private http: HttpClient,
    private pcService: PcService,
    private warningService: WarningService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.allFilterableElements$
        .pipe(
          take(1),
          switchMap((elems) => {
            if (this.reportControlService.plantaFija) {
              this.allAnomalias = elems as Anomalia[];
            } else {
              this.allSeguidores = elems as Seguidor[];
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
            this.checkWarnings();
          }
        })
    );
  }

  private checkWarnings() {
    this.warningService.getWarnings(this.selectedInforme.id).subscribe((warnings) => {
      this.warnings = warnings;

      this.warningService.checkTiposAnoms(this.selectedInforme, this.anomaliasInforme, this.warnings);
      this.warningService.checkNumsCoA(this.selectedInforme, this.anomaliasInforme, this.warnings);
      this.warningService.checkNumsCriticidad(this.selectedInforme, this.anomaliasInforme, this.warnings);
      this.warningService.checkFilsColsPlanta(this.planta, this.selectedInforme, this.warnings);
      this.warningService.checkFilsColsAnoms(this.planta, this.anomaliasInforme, this.selectedInforme, this.warnings);
      this.warningService.checkZonesWarnings(
        this.locAreas,
        this.selectedInforme,
        this.warnings,
        this.planta,
        this.anomaliasInforme
      );
      // this.checkAerialLayer();
      // this.checkThermalLayer();
    });
  }

  fixProblem(action: string) {
    const urlPlantaEdit = this.router.serializeUrl(this.router.createUrlTree(['admin/plants/edit/' + this.planta.id]));
    const urlLocalizaciones = this.router.serializeUrl(
      this.router.createUrlTree(['clientes/auto-loc/' + this.planta.id])
    );

    switch (action) {
      case 'tiposAnom':
        this.reportControlService.setTiposAnomInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
      case 'numsCoA':
        this.reportControlService.setNumAnomsCoAInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
      case 'numsCriticidad':
        this.reportControlService.setNumAnomsCritInforme(this.anomaliasInforme, this.selectedInforme, true);
        break;
      case 'irPlantaEdit':
        window.open(urlPlantaEdit, '_blank');
        break;
      case 'recalMAEyCC':
        this.recalMAEyCC();
        break;
      case 'filsColsAnoms':
        const filColFilter: LocationFilter = new LocationFilter('location', this.planta.filas, this.planta.columnas);
        this.filterService.addFilter(filColFilter);
        break;
      case 'wrongLocAnoms':
        this.filterWrongLocAnoms();
        break;
      case 'irLocs':
        window.open(urlLocalizaciones, '_blank');
        break;

      // case 'nombresZonas':
      //   window.open(urlPlantaEdit, '_blank');
      //   break;

      // case 'modulosAnoms':
      //   this.fixModulosAnoms();
      //   break;

      // case 'noGlobalCoordsAnoms':
      //   this.fixNoGlobalCoordsAnoms();
      //   break;
    }
  }

  private recalMAEyCC() {
    const seguidoresInforme = this.allSeguidores.filter((seg) => seg.informeId === this.selectedInforme.id);

    this.reportControlService.setMaeInformeSeguidores(seguidoresInforme, this.selectedInforme);
    this.reportControlService.setCCInformeSeguidores(seguidoresInforme, this.selectedInforme);
  }

  private filterWrongLocAnoms() {
    const wrongGlobalsFilter = new WrongGlobalCoordsFilter(
      'wrongGlobals',
      this.reportControlService.numFixedGlobalCoords - 1
    );

    this.filterService.addFilter(wrongGlobalsFilter);
  }

  // private checkNoGlobalCoordsAnoms() {
  //   const noGlobalCoordsAnoms = this.anomaliasInforme.filter(
  //     (anom) => anom.globalCoords === null || anom.globalCoords === undefined || anom.globalCoords[0] === null
  //   );

  //   if (noGlobalCoordsAnoms.length > 0) {
  //     if (noGlobalCoordsAnoms.length === 1) {
  //       const warning = {
  //         content: `Hay ${noGlobalCoordsAnoms.length} anomalía que no tiene globalCoords`,
  //         types: ['noGlobalCoordsAnoms'],
  //         actions: ['Corregir'],
  //       };

  //       this.addWarning(warning);
  //     } else {
  //       const warning = {
  //         content: `Hay ${noGlobalCoordsAnoms.length} anomalías que no tienen globalCoords`,
  //         types: ['noGlobalCoordsAnoms'],
  //         actions: ['Corregir'],
  //       };

  //       this.addWarning(warning);
  //     }
  //   }
  // }

  // private fixNoGlobalCoordsAnoms() {
  //   const noGlobalCoordsAnoms = this.anomaliasInforme.filter(
  //     (anom) => anom.globalCoords === null || anom.globalCoords === undefined || anom.globalCoords[0] === null
  //   );

  //   noGlobalCoordsAnoms.forEach((anom, index, anoms) => {
  //     const globalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(anom.featureCoords[0], this.locAreas);

  //     if (globalCoords !== null && globalCoords !== undefined && globalCoords[0] !== null) {
  //       anom.globalCoords = globalCoords;

  //       this.anomaliaService.updateAnomaliaField(anom.id, 'globalCoords', globalCoords);
  //     }

  //     // checkeamos los warnings al terminar de escribir los modulos que faltan
  //     if (index === anoms.length - 1) {
  //       this.checkWanings();
  //     }
  //   });
  // }

  // private checkZonesNames() {
  //   if (
  //     !this.planta.hasOwnProperty('nombreGlobalCoords') ||
  //     this.planta.nombreGlobalCoords === null ||
  //     this.planta.nombreGlobalCoords === undefined ||
  //     this.planta.nombreGlobalCoords.length === 0
  //   ) {
  //     const warning = {
  //       content: 'Faltan los nombres de las zonas de la planta',
  //       types: ['nombresZonas'],
  //       actions: ['Ir a Editar planta'],
  //     };

  //     this.addWarning(warning);
  //   }
  // }

  // private checkModulosWarnings() {
  //   const areasConModulo = this.locAreas.filter(
  //     (locArea) => locArea.hasOwnProperty('modulo') && locArea.modulo !== null && locArea.modulo !== undefined
  //   );

  //   if (areasConModulo.length > 0) {
  //     this.checkModulosAnoms();
  //   } else {
  //     // añadimos el aviso de que faltan los modulos de la planta
  //     const warning = {
  //       content: 'Faltan los módulos de la planta',
  //       types: ['irLoc'],
  //       actions: ['Ir a Localizaciones'],
  //     };

  //     this.addWarning(warning);
  //   }
  // }

  // private checkModulosAnoms() {
  //   const anomsSinModulo = this.anomaliasInforme.filter((anom) => anom.modulo === null || anom.modulo === undefined);

  //   if (anomsSinModulo.length > 0) {
  //     if (anomsSinModulo.length === 1) {
  //       const warning = {
  //         content: `Hay ${anomsSinModulo.length} anomalía sin módulo`,
  //         types: ['modulosAnoms'],
  //         actions: ['Corregir'],
  //       };

  //       this.addWarning(warning);
  //     } else {
  //       const warning = {
  //         content: `Hay ${anomsSinModulo.length} anomalías sin módulo`,
  //         types: ['modulosAnoms'],
  //         actions: ['Corregir'],
  //       };

  //       this.addWarning(warning);
  //     }
  //   }
  // }

  // private fixModulosAnoms() {
  //   const anomsSinModulo = this.anomaliasInforme.filter((anom) => anom.modulo === null || anom.modulo === undefined);

  //   anomsSinModulo.forEach((anom, index, anoms) => {
  //     let modulo: ModuloInterface;
  //     if (this.reportControlService.plantaFija) {
  //       modulo = this.anomaliaService.getModule(anom.featureCoords[0], this.locAreas);

  //       if (modulo !== null) {
  //         anom.modulo = modulo;

  //         this.anomaliaService.updateAnomaliaField(anom.id, 'modulo', modulo);
  //       }
  //     } else {
  //       const seguidoresInforme = this.allSeguidores.filter((seg) => seg.informeId === this.selectedInforme.id);
  //       const seguidorAnom = seguidoresInforme.find(
  //         (seg) => seg.globalCoords.toString().replace(/,/g, '') === anom.globalCoords.toString().replace(/,/g, '')
  //       );

  //       modulo = seguidorAnom.modulo;

  //       if (modulo !== null) {
  //         anom.modulo = modulo;

  //         this.pcService.updatePc(anom as PcInterface);
  //       }
  //     }

  //     // checkeamos los warnings al terminar de escribir los modulos que faltan
  //     if (index === anoms.length - 1) {
  //       this.checkWanings();
  //     }
  //   });
  // }

  // private checkAerialLayer() {
  //   const url = 'https://solardrontech.es/tileserver.php?/index.json?/' + this.selectedInforme.id + '_visual/1/1/1.png';

  //   this.http
  //     .get(url)
  //     .pipe(
  //       take(1),
  //       catchError((error) => {
  //         // no recibimos respuesta del servidor porque no existe
  //         if (error.status === 0) {
  //           const warning = {
  //             content: 'No existe la capa visual',
  //             types: ['visualLayer'],
  //             actions: [''],
  //           };

  //           this.addWarning(warning);
  //         }

  //         return [];
  //       }),
  //       take(1)
  //     )
  //     .subscribe((data) => console.log(''));
  // }

  // private checkThermalLayer() {
  //   if (this.reportControlService.plantaFija) {
  //     const url =
  //       'https://solardrontech.es/tileserver.php?/index.json?/' + this.selectedInforme.id + '_thermal/1/1/1.png';

  //     this.http
  //       .get(url)
  //       .pipe(
  //         take(1),
  //         catchError((error) => {
  //           // no recibimos respuesta del servidor porque no existe
  //           if (error.status === 0) {
  //             const warning = {
  //               content: 'No existe la capa térmica',
  //               types: ['thermalLayer'],
  //               actions: [''],
  //             };

  //             this.addWarning(warning);
  //           }

  //           return [];
  //         }),
  //         take(1)
  //       )
  //       .subscribe((data) => console.log(''));
  //   }
  // }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
