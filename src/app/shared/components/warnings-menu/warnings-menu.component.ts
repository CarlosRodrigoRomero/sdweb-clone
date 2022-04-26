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
            this.checkWanings();
          }
        })
    );
  }

  private checkWanings() {
    this.warningService.getWarnings(this.selectedInforme.id).subscribe((warnings) => {
      this.warnings = warnings;

      // setTimeout(() => {
      //   this.checkTiposAnoms();
      //   this.checkNumsCoA();
      //   // this.checkNumsCriticidad();
      //   // this.checkFilsColsPlanta();
      //   // this.checkFilColAnoms();
      //   // this.checkZonesWarnings();
      //   // this.checkAerialLayer();
      //   // this.checkThermalLayer();
      // }, 2000);

      this.checkTiposAnoms();
      this.checkNumsCoA();
      // this.checkNumsCriticidad();
      // this.checkFilsColsPlanta();
      // this.checkFilColAnoms();
      // this.checkZonesWarnings();
      // this.checkAerialLayer();
      // this.checkThermalLayer();
    });
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
      // case 'numsCriticidad':
      //   this.reportControlService.setNumAnomsCritInforme(this.anomaliasInforme, this.selectedInforme, true);
      //   break;
      // case 'filsColsPlanta':
      //   window.open(urlPlantaEdit, '_blank');
      //   break;
      // case 'recalMAEyCC':
      //   this.recalMAEyCC();
      //   break;
      // case 'irLoc':
      //   window.open(urlLocalizaciones, '_blank');
      //   break;
      // case 'nombresZonas':
      //   window.open(urlPlantaEdit, '_blank');
      //   break;
      // case 'filsColsAnoms':
      //   const filColFilter: LocationFilter = new LocationFilter('location', this.planta.filas, this.planta.columnas);
      //   this.filterService.addFilter(filColFilter);
      //   break;

      // case 'modulosAnoms':
      //   this.fixModulosAnoms();
      //   break;
      // case 'globalCoordsAnoms':
      //   this.filterWrongGlobalCoordsAnoms();
      //   break;
      // case 'noGlobalCoordsAnoms':
      //   this.fixNoGlobalCoordsAnoms();
      //   break;
    }
  }

  private addWarning(warning: Warning) {
    if (this.warnings.map((warn) => warn.type).includes(warning.type)) {
      this.warningService.updateWarning(this.selectedInforme.id, warning);
    } else {
      this.warningService.addWarning(this.selectedInforme.id, warning);
    }
  }

  private checkOldWarning(type: string) {
    const oldWarning = this.warnings.find((warn) => warn.type === type);

    if (oldWarning) {
      this.warningService.deleteWarning(this.selectedInforme.id, oldWarning.id);
    }
  }

  private checkTiposAnoms() {
    if (this.selectedInforme !== undefined && this.anomaliasInforme.length > 0) {
      if (this.selectedInforme.tiposAnomalias.length > 0) {
        // primero eliminamos la alerta antigua de no tener tipoAnoms si la hubiera
        this.checkOldWarning('tiposAnom');

        const sumTiposAnom = this.selectedInforme.tiposAnomalias.reduce((acum, curr, index) => {
          // las celulas calientes son un array por separado
          if (index === 8 || index === 9) {
            return acum + curr.reduce((a, c) => a + c);
          } else {
            return acum + curr;
          }
        });

        if (this.anomaliasInforme.length !== sumTiposAnom) {
          const warning = {
            type: 'sumTiposAnom',
            visible: true,
          };

          this.addWarning(warning);
        } else {
          // eliminamos la alerta antigua si la hubiera
          this.checkOldWarning('sumTiposAnom');
        }
      } else {
        const warning = {
          type: 'tiposAnom',
          visible: true,
        };

        this.addWarning(warning);
      }
    }
  }

  private checkNumsCoA() {
    if (this.selectedInforme !== undefined && this.anomaliasInforme.length > 0) {
      if (this.selectedInforme.numsCoA.length > 0) {
        // primero eliminamos la alerta antigua de no tener numsCoA si la hubiera
        this.checkOldWarning('numsCoA');

        const sumNumsCoA = this.selectedInforme.numsCoA.reduce((acum, curr) => acum + curr);

        if (this.anomaliasInforme.length !== sumNumsCoA) {
          const warning = {
            type: 'sumNumsCoA',
            visible: true,
          };

          this.addWarning(warning);
        } else {
          // eliminamos la alerta antigua si la hubiera
          this.checkOldWarning('sumNumsCoA');
        }
      } else {
        const warning = {
          type: 'numsCoA',
          visible: true,
        };

        this.addWarning(warning);
      }
    }
  }

  /* private checkNumsCriticidad() {
    if (this.selectedInforme !== undefined && this.anomaliasInforme.length > 0) {
      if (this.selectedInforme.numsCriticidad.length > 0) {
        const sumNumsCriticidad = this.selectedInforme.numsCriticidad.reduce((acum, curr) => acum + curr);

        if (this.anomaliasInforme.length !== sumNumsCriticidad) {
          const warning = {
            content: 'El nº de anomalías no coincide con la suma de las anomalías por criticidad',
            types: ['sumNumsCriticidad'],
            actions: ['Corregir'],
          };

          this.addWarning(warning);
        }
      } else {
        const warning = {
          content: 'El nº de anomalías por criticidad es incorrecto',
          types: ['numsCriticidad'],
          actions: ['Corregir'],
        };

        this.addWarning(warning);
      }
    }
  }

  private checkFilsColsPlanta() {
    if (this.planta.columnas <= 1 || this.planta.columnas === undefined || this.planta.columnas === null) {
      if (this.reportControlService.plantaFija) {
        const warning = {
          content: 'El nº de filas y columnas de la planta no son correctos',
          types: ['filsColsPlanta'],
          actions: ['Ir a Editar planta'],
        };

        this.addWarning(warning);
      } else {
        const warning = {
          content: 'El nº de filas y columnas de la planta no son correctos y por tanto MAE y CC están mal',
          types: ['filsColsPlanta', 'recalMAEyCC'],
          actions: ['Ir a Editar planta', 'Recalcular MAE y CC'],
        };

        this.addWarning(warning);
      }
    }
  }

  private recalMAEyCC() {
    const seguidoresInforme = this.allSeguidores.filter((seg) => seg.informeId === this.selectedInforme.id);

    this.reportControlService.setMaeInformeSeguidores(seguidoresInforme, this.selectedInforme);
    this.reportControlService.setCCInformeSeguidores(seguidoresInforme, this.selectedInforme);
  }

  private checkFilColAnoms() {
    // primero comprobamos que el nº de filas y columnas de la planta sean correctos
    if (this.planta.columnas > 1 && this.planta.columnas !== undefined && this.planta.columnas !== null) {
      const differentFilColAnoms = this.anomaliasInforme.filter(
        (anom) => anom.localY > this.planta.filas || anom.localX > this.planta.columnas
      );

      if (differentFilColAnoms.length > 0) {
        const warning = {
          content: 'Hay anomalías con posibles datos de fila y columna erroneos',
          types: ['filsColsAnoms'],
          actions: ['Filtrar'],
        };

        this.addWarning(warning);
      }
    }
  }

  private checkZonesWarnings() {
    if (this.locAreas.length > 0) {
      this.checkWrongGlobalCoordsAnoms();
      this.checkNoGlobalCoordsAnoms();
      this.checkZonesNames();
      this.checkModulosWarnings();
    } else {
      // añadimos el aviso de que faltan las zonas de la planta
      const warning = {
        content: 'Faltan las zonas de la planta',
        types: ['irLoc'],
        actions: ['Ir a Localizaciones'],
      };

      this.addWarning(warning);
    }
  }

  private checkWrongGlobalCoordsAnoms() {
    let anomsWrongGlobals: Anomalia[];
    if (this.reportControlService.plantaFija) {
      anomsWrongGlobals = this.anomaliasInforme.filter(
        (anom) => anom.globalCoords[this.reportControlService.numFixedGlobalCoords - 1] === null
      );
    } else {
      anomsWrongGlobals = this.anomaliasInforme.filter(
        (anom) => anom.globalCoords[this.seguidorService.numGlobalCoords - 1] === null
      );
    }

    if (anomsWrongGlobals.length > 0) {
      if (anomsWrongGlobals.length === 1) {
        const warning = {
          content: `Hay ${anomsWrongGlobals.length} anomalía que puede estar mal posicionada y estar fuera de las zonas que debería`,
          types: ['globalCoordsAnoms', 'irLoc'],
          actions: ['Filtrar', 'Ir a Localizaciones'],
        };

        this.addWarning(warning);
      } else {
        const warning = {
          content: `Hay ${anomsWrongGlobals.length} anomalías que pueden estar mal posicionadas y estar fuera de las zonas que deberían`,
          types: ['globalCoordsAnoms', 'irLoc'],
          actions: ['Filtrar', 'Ir a Localizaciones'],
        };

        this.addWarning(warning);
      }
    }
  }

  private filterWrongGlobalCoordsAnoms() {
    let wrongGlobalsFilter: WrongGlobalCoordsFilter;
    if (this.reportControlService.plantaFija) {
      wrongGlobalsFilter = new WrongGlobalCoordsFilter(
        'wrongGlobals',
        this.reportControlService.numFixedGlobalCoords - 1
      );
    } else {
      wrongGlobalsFilter = new WrongGlobalCoordsFilter('wrongGlobals', this.seguidorService.numGlobalCoords - 1);
    }

    this.filterService.addFilter(wrongGlobalsFilter);
  }

  private checkNoGlobalCoordsAnoms() {
    const noGlobalCoordsAnoms = this.anomaliasInforme.filter(
      (anom) => anom.globalCoords === null || anom.globalCoords === undefined || anom.globalCoords[0] === null
    );

    if (noGlobalCoordsAnoms.length > 0) {
      if (noGlobalCoordsAnoms.length === 1) {
        const warning = {
          content: `Hay ${noGlobalCoordsAnoms.length} anomalía que no tiene globalCoords`,
          types: ['noGlobalCoordsAnoms'],
          actions: ['Corregir'],
        };

        this.addWarning(warning);
      } else {
        const warning = {
          content: `Hay ${noGlobalCoordsAnoms.length} anomalías que no tienen globalCoords`,
          types: ['noGlobalCoordsAnoms'],
          actions: ['Corregir'],
        };

        this.addWarning(warning);
      }
    }
  }

  private fixNoGlobalCoordsAnoms() {
    const noGlobalCoordsAnoms = this.anomaliasInforme.filter(
      (anom) => anom.globalCoords === null || anom.globalCoords === undefined || anom.globalCoords[0] === null
    );

    noGlobalCoordsAnoms.forEach((anom, index, anoms) => {
      const globalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(anom.featureCoords[0], this.locAreas);

      if (globalCoords !== null && globalCoords !== undefined && globalCoords[0] !== null) {
        anom.globalCoords = globalCoords;

        this.anomaliaService.updateAnomaliaField(anom.id, 'globalCoords', globalCoords);
      }

      // checkeamos los warnings al terminar de escribir los modulos que faltan
      if (index === anoms.length - 1) {
        this.checkWanings();
      }
    });
  }

  private checkZonesNames() {
    if (
      !this.planta.hasOwnProperty('nombreGlobalCoords') ||
      this.planta.nombreGlobalCoords === null ||
      this.planta.nombreGlobalCoords === undefined ||
      this.planta.nombreGlobalCoords.length === 0
    ) {
      const warning = {
        content: 'Faltan los nombres de las zonas de la planta',
        types: ['nombresZonas'],
        actions: ['Ir a Editar planta'],
      };

      this.addWarning(warning);
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
      const warning = {
        content: 'Faltan los módulos de la planta',
        types: ['irLoc'],
        actions: ['Ir a Localizaciones'],
      };

      this.addWarning(warning);
    }
  }

  private checkModulosAnoms() {
    const anomsSinModulo = this.anomaliasInforme.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    if (anomsSinModulo.length > 0) {
      if (anomsSinModulo.length === 1) {
        const warning = {
          content: `Hay ${anomsSinModulo.length} anomalía sin módulo`,
          types: ['modulosAnoms'],
          actions: ['Corregir'],
        };

        this.addWarning(warning);
      } else {
        const warning = {
          content: `Hay ${anomsSinModulo.length} anomalías sin módulo`,
          types: ['modulosAnoms'],
          actions: ['Corregir'],
        };

        this.addWarning(warning);
      }
    }
  }

  private fixModulosAnoms() {
    const anomsSinModulo = this.anomaliasInforme.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    anomsSinModulo.forEach((anom, index, anoms) => {
      let modulo: ModuloInterface;
      if (this.reportControlService.plantaFija) {
        modulo = this.anomaliaService.getModule(anom.featureCoords[0], this.locAreas);

        if (modulo !== null) {
          anom.modulo = modulo;

          this.anomaliaService.updateAnomaliaField(anom.id, 'modulo', modulo);
        }
      } else {
        const seguidoresInforme = this.allSeguidores.filter((seg) => seg.informeId === this.selectedInforme.id);
        const seguidorAnom = seguidoresInforme.find(
          (seg) => seg.globalCoords.toString().replace(/,/g, '') === anom.globalCoords.toString().replace(/,/g, '')
        );

        modulo = seguidorAnom.modulo;

        if (modulo !== null) {
          anom.modulo = modulo;

          this.pcService.updatePc(anom as PcInterface);
        }
      }

      // checkeamos los warnings al terminar de escribir los modulos que faltan
      if (index === anoms.length - 1) {
        this.checkWanings();
      }
    });
  }

  private checkAerialLayer() {
    const url = 'https://solardrontech.es/tileserver.php?/index.json?/' + this.selectedInforme.id + '_visual/1/1/1.png';

    this.http
      .get(url)
      .pipe(
        take(1),
        catchError((error) => {
          // no recibimos respuesta del servidor porque no existe
          if (error.status === 0) {
            const warning = {
              content: 'No existe la capa visual',
              types: ['visualLayer'],
              actions: [''],
            };

            this.addWarning(warning);
          }

          return [];
        }),
        take(1)
      )
      .subscribe((data) => console.log(''));
  }

  private checkThermalLayer() {
    if (this.reportControlService.plantaFija) {
      const url =
        'https://solardrontech.es/tileserver.php?/index.json?/' + this.selectedInforme.id + '_thermal/1/1/1.png';

      this.http
        .get(url)
        .pipe(
          take(1),
          catchError((error) => {
            // no recibimos respuesta del servidor porque no existe
            if (error.status === 0) {
              const warning = {
                content: 'No existe la capa térmica',
                types: ['thermalLayer'],
                actions: [''],
              };

              this.addWarning(warning);
            }

            return [];
          }),
          take(1)
        )
        .subscribe((data) => console.log(''));
    }
  }
 */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
