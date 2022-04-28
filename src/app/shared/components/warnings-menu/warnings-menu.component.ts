import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { switchMap } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import { ReportControlService } from '@core/services/report-control.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { FilterService } from '@core/services/filter.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { PcService } from '@core/services/pc.service';
import { WarningService } from '@core/services/warning.service';
import { GLOBAL } from '@core/services/global';

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
  private informes: InformeInterface[] = this.reportControlService.informes;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private router: Router,
    private filterService: FilterService,
    private anomaliaService: AnomaliaService,
    private pcService: PcService,
    private warningService: WarningService
  ) {}

  ngOnInit(): void {
    if (this.reportControlService.plantaFija) {
      this.allAnomalias = this.reportControlService.allFilterableElements as Anomalia[];
    } else {
      this.allSeguidores = this.reportControlService.allFilterableElements as Seguidor[];
      (this.reportControlService.allFilterableElements as Seguidor[]).forEach((seg) =>
        this.allAnomalias.push(...seg.anomaliasCliente)
      );
    }

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$
        .pipe(
          switchMap((informeId) => {
            this.selectedInforme = this.informes.find((informe) => informe.id === informeId);

            return combineLatest([
              this.informeService.getInformesDePlanta(this.reportControlService.plantaId),
              this.plantaService.getPlanta(this.reportControlService.plantaId),
              this.plantaService.getLocationsArea(this.reportControlService.plantaId),
              this.warningService.getWarnings(this.selectedInforme.id),
            ]);
          })
        )
        .subscribe(([informes, planta, locAreas, warnings]) => {
          this.informes = informes;
          this.planta = planta;
          this.locAreas = locAreas;
          this.warnings = warnings;

          this.anomaliasInforme = this.allAnomalias.filter((anom) => anom.informeId === this.selectedInforme.id);

          this.selectedInforme = this.informes.find((informe) => informe.id === this.selectedInforme.id);

          if (this.selectedInforme !== undefined) {
            this.checkWarnings();
          }
        })
    );
  }

  private checkWarnings() {
    this.warningService.checkTiposAnoms(this.selectedInforme, this.anomaliasInforme, this.warnings);
    this.warningService.checkNumsCoA(this.selectedInforme, this.anomaliasInforme, this.warnings);
    this.warningService.checkNumsCriticidad(this.selectedInforme, this.anomaliasInforme, this.warnings);
    this.warningService.checkMAE(this.selectedInforme, this.warnings);
    this.warningService.checkCC(this.selectedInforme, this.warnings);
    this.warningService.checkFilsColsPlanta(this.planta, this.selectedInforme, this.warnings);
    this.warningService.checkFilsColsAnoms(this.planta, this.anomaliasInforme, this.selectedInforme, this.warnings);
    this.warningService.checkZonesWarnings(
      this.locAreas,
      this.selectedInforme,
      this.warnings,
      this.planta,
      this.anomaliasInforme
    );
    this.warningService.checkAerialLayer(this.selectedInforme.id, this.warnings);
    this.warningService.checkThermalLayer(this.selectedInforme.id, this.warnings);
    this.warningService.checkImagePortada(this.selectedInforme.id, this.warnings);
    this.warningService.checkImageSuciedad(this.selectedInforme.id, this.warnings);
    this.warningService.checkTempMaxAnomsError(this.anomaliasInforme, this.warnings, this.selectedInforme.id);
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
