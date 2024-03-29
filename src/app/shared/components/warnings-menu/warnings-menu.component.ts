import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { switchMap, take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';
import { PlantaService } from '@data/services/planta.service';
import { FilterService } from '@data/services/filter.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PcService } from '@data/services/pc.service';
import { WarningService } from '@data/services/warning.service';
import { SeguidorService } from '@data/services/seguidor.service';
import { AuthService } from '@data/services/auth.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ReportRecalcService } from '@data/services/report-recalc.service';

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
import { UserInterface } from '@core/models/user';

import { GLOBAL } from '@data/constants/global';
import { NoModulesFilter } from '@core/models/noModulesFilter';
import { NoGlobalCoordsFilter } from '@core/models/noGlobalCoordsFilter';

@Component({
  selector: 'app-warnings-menu',
  templateUrl: './warnings-menu.component.html',
  styleUrls: ['./warnings-menu.component.css'],
})
export class WarningsMenuComponent implements OnInit, OnDestroy {
  warnings: Warning[] = [];
  private selectedInforme: InformeInterface;
  private anomaliasInforme: Anomalia[] = [];
  private planta: PlantaInterface;
  private locAreas: LocationAreaInterface[] = [];
  private allSeguidores: Seguidor[] = [];
  private informes: InformeInterface[] = this.reportControlService.informes;
  checked = true;
  private user: UserInterface;
  timesChecked = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private router: Router,
    private filterService: FilterService,
    private anomaliaService: AnomaliaService,
    private pcService: PcService,
    private warningService: WarningService,
    private seguidorService: SeguidorService,
    private olMapService: OlMapService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private reportRecalcService: ReportRecalcService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.user$
        .pipe(
          take(1),
          switchMap((user) => {
            this.user = user;

            return this.reportControlService.selectedInformeId$;
          }),
          switchMap((informeId) => {
            this.selectedInforme = this.informes.find((informe) => informe.id === informeId);

            return this.warningService.getWarnings(informeId);
          })
        )
        .subscribe((warnings) => {
          this.warnings = warnings;

          // detectamos cambios porque estamos utilizando la estrategia OnPush
          this.cdr.detectChanges();
        })
    );

    this.planta = this.reportControlService.planta;
  }

  loadDataAndCheck() {
    let getInformes$ = this.informeService.getInformesDisponiblesDePlanta(this.reportControlService.plantaId);
    if (this.authService.userIsAdmin(this.user)) {
      getInformes$ = this.informeService.getInformesDePlanta(this.reportControlService.plantaId);
    }

    if (this.reportControlService.plantaNoS2E || this.selectedInforme.fecha > GLOBAL.dateS2eAnomalias) {
      this.subscriptions.add(
        combineLatest([
          getInformes$,
          this.plantaService.getPlanta(this.reportControlService.plantaId),
          this.plantaService.getLocationsArea(this.reportControlService.plantaId),
          this.warningService.getWarnings(this.selectedInforme.id),
          this.anomaliaService.getAnomaliasInforme$(this.selectedInforme.id),
        ]).subscribe(([informes, planta, locAreas, warnings, anomalias]) => {
          this.informes = informes;
          this.planta = planta;
          this.locAreas = locAreas;
          this.warnings = warnings;

          this.anomaliasInforme = this.anomaliaService.getRealAnomalias(anomalias);

          this.selectedInforme = this.informes.find((informe) => informe.id === this.selectedInforme.id);

          if (this.selectedInforme !== undefined) {
            this.checked = this.warningService.checkWarnings(
              this.selectedInforme,
              this.anomaliasInforme,
              this.warnings,
              this.planta,
              this.locAreas
            );

            // detectamos cambios porque estamos utilizando la estrategia OnPush
            this.cdr.detectChanges();
          }
        })
      );
    } else {
      this.subscriptions.add(
        combineLatest([
          getInformes$,
          this.plantaService.getPlanta(this.reportControlService.plantaId),
          this.plantaService.getLocationsArea(this.reportControlService.plantaId),
          this.warningService.getWarnings(this.selectedInforme.id),
        ]).subscribe(([informes, planta, locAreas, warnings]) => {
          this.informes = informes;
          this.planta = planta;
          this.locAreas = locAreas;
          this.warnings = warnings;

          this.anomaliasInforme = this.reportControlService.allAnomalias.filter(
            (anom) => anom.informeId === this.selectedInforme.id
          );

          this.selectedInforme = this.informes.find((informe) => informe.id === this.selectedInforme.id);

          const seguidoresInforme = this.reportControlService.allFilterableElements.filter(
            (segs) => segs.informeId === this.selectedInforme.id
          ) as Seguidor[];

          if (this.selectedInforme !== undefined) {
            this.checked = this.warningService.checkWarnings(
              this.selectedInforme,
              this.anomaliasInforme,
              this.warnings,
              this.planta,
              this.locAreas,
              seguidoresInforme
            );

            // detectamos cambios porque estamos utilizando la estrategia OnPush
            this.cdr.detectChanges();
          }
        })
      );
    }
  }

  offChecked() {
    this.checked = false;
  }

  fixProblem(action: string) {
    const urlPlantaEdit = this.router.serializeUrl(this.router.createUrlTree(['admin/plants/edit/' + this.planta.id]));
    const urlLocalizaciones = this.router.serializeUrl(
      this.router.createUrlTree(['clientes/auto-loc/' + this.planta.id])
    );
    const urlStorage = GLOBAL.urlStorageInformes + '~2F' + this.selectedInforme.id;

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
      case 'filsColsAnoms0':
        const filCol0Filter: LocationFilter = new LocationFilter(
          'locationTipo0',
          this.planta.filas,
          this.planta.columnas
        );
        this.filterService.addFilter(filCol0Filter);
        break;
      case 'wrongLocAnoms':
        this.filterWrongLocAnoms();
        break;
      case 'recalGlobalCoords':
        this.recalWrongLocAnoms();
        break;
      case 'irLocs':
        window.open(urlLocalizaciones, '_blank');
        break;
      case 'noGlobalCoordsAnoms':
        this.fixNoGlobalCoordsAnoms();
        break;
      case 'noGlobalCoordsAnomsFilter':
        this.filterNoGlobalCoordsAnoms();
        break;
      case 'nombresZonas':
        window.open(urlPlantaEdit, '_blank');
        break;
      case 'modulosAnoms':
        this.filterNoModulesAnoms();
        break;
      case 'recalcModulosAnoms':
        this.fixModulosAnoms();
        break;
      case 'irStorage':
        window.open(urlStorage, '_blank');
        break;
    }
  }

  private recalMAEyCC() {
    this.reportRecalcService.recalMAEyCC(this.selectedInforme);
  }

  private filterWrongLocAnoms() {
    const wrongGlobalsFilter = new WrongGlobalCoordsFilter(
      'wrongGlobals',
      this.reportControlService.numFixedGlobalCoords - 1
    );

    this.filterService.addFilter(wrongGlobalsFilter);
  }

  private recalWrongLocAnoms() {
    // nos traemos de nuevo las locAreas por si hay nuevas o se han modificado en localizaciones
    this.plantaService
      .getLocationsArea(this.reportControlService.plantaId)
      .pipe(take(1))
      .subscribe((locAreas) => {
        this.locAreas = locAreas;

        // corregimos los elementos filtrados previamente que son los que tienen las globalCoords mal
        this.filterService.filteredElements.forEach((anom) => {
          const anomCentroid = this.olMapService.getCentroid((anom as Anomalia).featureCoords);
          const newGlobalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(anomCentroid, this.locAreas);

          this.anomaliaService.updateAnomaliaField(anom.id, 'globalCoords', newGlobalCoords);
        });
      });
  }

  private filterNoModulesAnoms() {
    const noModulesFilter = new NoModulesFilter('noModulesAnoms');

    this.filterService.addFilter(noModulesFilter);
  }

  private fixNoGlobalCoordsAnoms() {
    const noGlobalCoordsAnoms = this.anomaliasInforme.filter(
      (anom) => anom.globalCoords === null || anom.globalCoords === undefined || anom.globalCoords[0] === null
    );

    noGlobalCoordsAnoms.forEach((anom) => {
      const globalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(anom.featureCoords[0], this.locAreas);

      if (globalCoords !== null && globalCoords !== undefined && globalCoords[0] !== null) {
        anom.globalCoords = globalCoords;

        this.anomaliaService.updateAnomaliaField(anom.id, 'globalCoords', globalCoords);
      }
    });
  }

  private filterNoGlobalCoordsAnoms() {
    const noGlobalCoordsFilter = new NoGlobalCoordsFilter('noGlobalCoordsAnoms');

    this.filterService.addFilter(noGlobalCoordsFilter);
  }

  private fixModulosAnoms() {
    const anomsSinModulo = this.anomaliasInforme.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    anomsSinModulo.forEach((anom) => {
      let modulo: ModuloInterface;
      if (this.reportControlService.plantaNoS2E) {
        modulo = this.anomaliaService.getModule(this.olMapService.getCentroid(anom.featureCoords), this.locAreas);

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
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
