import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { GLOBAL } from '@data/constants/global';
import { SeguidorService } from '@data/services/seguidor.service';

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
import { OlMapService } from '@data/services/ol-map.service';

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
  private informes: InformeInterface[] = this.reportControlService.informes;
  checked = true;

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
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInforme = this.informes.find((informe) => informe.id === informeId);

        if (this.selectedInforme !== undefined) {
          this.loadDataAndCheck();
        }
      })
    );

    this.subscriptions.add(
      this.warningService.getWarnings(this.selectedInforme.id).subscribe((warnings) => (this.warnings = warnings))
    );
  }

  loadDataAndCheck() {
    if (this.reportControlService.plantaFija) {
      this.anomaliaService
        .getAnomalias$(this.selectedInforme.id, 'anomalias')
        .pipe(
          take(1),
          switchMap((anomalias) => {
            this.allAnomalias = this.anomaliaService.getRealAnomalias(anomalias);

            return combineLatest([
              this.informeService.getInformesDisponiblesDePlanta(this.reportControlService.plantaId),
              this.plantaService.getPlanta(this.reportControlService.plantaId),
              this.plantaService.getLocationsArea(this.reportControlService.plantaId),
              this.warningService.getWarnings(this.selectedInforme.id),
            ]);
          }),
          take(1)
        )
        .subscribe(([informes, planta, locAreas, warnings]) => {
          this.informes = informes;
          this.planta = planta;
          this.locAreas = locAreas;
          this.warnings = warnings;

          this.anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === this.selectedInforme.id);

          this.selectedInforme = this.informes.find((informe) => informe.id === this.selectedInforme.id);

          if (this.selectedInforme !== undefined) {
            this.checked = this.warningService.checkWarnings(
              this.selectedInforme,
              this.anomaliasInforme,
              this.warnings,
              this.planta,
              this.locAreas
            );
          }
        });
    } else {
      this.seguidorService
        .getSeguidores$(this.selectedInforme.id, this.reportControlService.plantaId, 'pcs')
        .pipe(
          take(1),
          switchMap((segs) => {
            this.allSeguidores = segs;

            // vaciamos primero para que no se acumule
            this.allAnomalias = [];
            this.allSeguidores.forEach((seg) => this.allAnomalias.push(...seg.anomaliasCliente));

            return combineLatest([
              this.informeService.getInformesDisponiblesDePlanta(this.reportControlService.plantaId),
              this.plantaService.getPlanta(this.reportControlService.plantaId),
              this.plantaService.getLocationsArea(this.reportControlService.plantaId),
              this.warningService.getWarnings(this.selectedInforme.id),
            ]);
          }),
          take(1)
        )
        .subscribe(([informes, planta, locAreas, warnings]) => {
          this.informes = informes;
          this.planta = planta;
          this.locAreas = locAreas;
          this.warnings = warnings;

          this.anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === this.selectedInforme.id);

          this.selectedInforme = this.informes.find((informe) => informe.id === this.selectedInforme.id);

          if (this.selectedInforme !== undefined) {
            this.checked = this.warningService.checkWarnings(
              this.selectedInforme,
              this.anomaliasInforme,
              this.warnings,
              this.planta,
              this.locAreas
            );
          }
        });
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
      case 'nombresZonas':
        window.open(urlPlantaEdit, '_blank');
        break;
      case 'modulosAnoms':
        this.fixModulosAnoms();
        break;
      case 'irStorage':
        window.open(urlStorage, '_blank');
        break;
    }
  }

  private recalMAEyCC() {
    if (this.reportControlService.plantaFija) {
      this.reportControlService.setMaeInformeFija(this.anomaliasInforme, this.selectedInforme);
      this.reportControlService.setCCInformeFija(this.anomaliasInforme, this.selectedInforme);
    } else {
      const seguidoresInforme = this.allSeguidores.filter((seg) => seg.informeId === this.selectedInforme.id);

      this.reportControlService.setMaeInformeSeguidores(seguidoresInforme, this.selectedInforme);
      this.reportControlService.setCCInformeSeguidores(seguidoresInforme, this.selectedInforme);
    }
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

  private fixModulosAnoms() {
    const anomsSinModulo = this.anomaliasInforme.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    anomsSinModulo.forEach((anom) => {
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
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
