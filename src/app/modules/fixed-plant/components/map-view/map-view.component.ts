import { Component, OnInit, OnDestroy, ViewChild, ComponentFactoryResolver } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { StatsService } from '@data/services/stats.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { ZonesService } from '@data/services/zones.service';
import { ResetServices } from '@data/services/reset-services.service';
import { ViewReportService } from '@data/services/view-report.service';
import { MatSidenav } from '@angular/material/sidenav';

import { DynamicStatsDirective } from '@modules/stats-plant/directives/dynamic-stats.directive';

import { PlantaStatsComponent } from '@modules/stats-plant/components/planta-stats.component';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit, OnDestroy {
  plantaFija = true;
  // rightOpened = false;
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

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  @ViewChild(DynamicStatsDirective) dynamicStats: DynamicStatsDirective;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private statsService: StatsService,
    private downloadReportService: DownloadReportService,
    private zonesService: ZonesService,
    private resetServicesService: ResetServices,
    private viewReportService: ViewReportService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;

      this.numInformes = this.reportControlService.informes.length;
    });

    this.subscriptions.add(
      this.reportControlService.sharedReportWithFilters$.subscribe((value) => (this.showFilters = value))
    );
    this.subscriptions.add(this.reportControlService.sharedReport$.subscribe((value) => (this.sharedReport = value)));

    this.subscriptions.add(this.reportControlService.completeView$.subscribe((value) => (this.completeView = value)));

    this.subscriptions.add(this.reportControlService.mapLoaded$.subscribe((value) => (this.mapLoaded = value)));

    this.subscriptions.add(this.zonesService.thereAreZones$.subscribe((value) => (this.thereAreZones = value)));

    this.subscriptions.add(
      this.zonesService.thereAreLargestZones$.subscribe((value) => (this.thereAreLargestZones = value))
    );

    this.subscriptions.add(this.reportControlService.noAnomsReport$.subscribe((value) => (this.noAnomsReport = value)));

    this.subscriptions.add(
      this.downloadReportService.generatingDownload$.subscribe((value) => (this.generatingDownload = value))
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((viewSel) => (this.viewSelected = viewSel))
    );
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
    const component = this.componentFactoryResolver.resolveComponentFactory(PlantaStatsComponent);

    this.dynamicStats.viewContainerRef.clear();
    this.dynamicStats.viewContainerRef.createComponent(component);
  }

  ngOnDestroy(): void {
    // nos desuscribimos de los observables
    this.subscriptions.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.resetServicesService.resetServices();
  }
}
