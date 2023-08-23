import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { StatsService } from '@data/services/stats.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { ZonesService } from '@data/services/zones.service';
import { ViewReportService } from '@data/services/view-report.service';
import { ResetServices } from '@data/services/reset-services.service';

import { DynamicStatsDirective } from '@modules/stats-plant/directives/dynamic-stats.directive';

import { PlantaStatsComponent } from '@modules/stats-plant/components/planta-stats.component';
import { FiltersPanelContainerComponent } from '@modules/filters/containers/filters-panel-container/filters-panel-container.component';

import { Patches } from '@core/classes/patches';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit, OnDestroy {
  plantaFija = true;
  rightOpened = false;
  filtersOpened = false;
  // statsOpened: boolean;
  anomaliasLoaded = false;
  sharedReport = false;
  completeView = false;
  showFilters = true;
  mapLoaded = false;
  noAnomsReport = false;
  thereAreZones = true;
  thereAreLargestZones = false;
  generatingDownload = false;
  selectedInformeId: string;
  numInformes = 1;
  viewSelected: string;
  groupPlant = true;

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;
  @ViewChild('sidenavFilters') sidenavFilters: MatSidenav;

  @ViewChild(DynamicStatsDirective) dynamicStats: DynamicStatsDirective;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private statsService: StatsService,
    private downloadReportService: DownloadReportService,
    private zonesService: ZonesService,
    private viewReportService: ViewReportService,
    private resetServices: ResetServices
  ) {}

  ngOnInit(): void {
    this.numInformes = this.reportControlService.informes.length;

    this.subscriptions.add(
      this.reportControlService.sharedReportWithFilters$.subscribe((value) => (this.showFilters = value))
    );
    this.subscriptions.add(this.reportControlService.sharedReport$.subscribe((value) => (this.sharedReport = value)));

    this.subscriptions.add(this.reportControlService.completeView$.subscribe((value) => (this.completeView = value)));

    this.subscriptions.add(this.zonesService.thereAreZones$.subscribe((value) => (this.thereAreZones = value)));

    this.subscriptions.add(
      this.zonesService.thereAreLargestZones$.subscribe((value) => (this.thereAreLargestZones = value))
    );

    this.subscriptions.add(this.reportControlService.noAnomsReport$.subscribe((value) => (this.noAnomsReport = value)));

    this.subscriptions.add(
      this.downloadReportService.generatingDownload$.subscribe((value) => (this.generatingDownload = value))
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInformeId = informeId;
      })
    );

    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((viewSel) => (this.viewSelected = viewSel))
    );

    this.subscriptions.add(
      this.reportControlService.mapLoaded$.subscribe((value) => {
        this.mapLoaded = value;

        if (this.mapLoaded) {
          this.statsService.setSidenav(this.sidenavStats);
        }
      })
    );

    this.groupPlant = Patches.plantsNoGroupByZones(this.reportControlService.plantaId);
  }

  showControls() {
    if (document.getElementById('map-control').style.display === 'none') {
      document.getElementById('map-control').style.display = 'unset';
    } else {
      document.getElementById('map-control').style.display = 'none';
    }
  }

  setSidenavStats(sidenavStats: MatSidenav) {
    this.statsService.setSidenav(sidenavStats);
  }

  loadStats() {
    this.dynamicStats.viewContainerRef.clear();
    this.dynamicStats.viewContainerRef.createComponent(PlantaStatsComponent);
  }

  ngOnDestroy(): void {
    // nos desuscribimos de los observables
    this.subscriptions.unsubscribe();

    // reseteamos los servicios relacionados con los informes a sus valores por defecto
    this.resetServices.resetReportsServices();
  }
}
