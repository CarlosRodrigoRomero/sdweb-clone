import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { ReportControlService } from '@core/services/report-control.service';
import { StatsService } from '@core/services/stats.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ThermalService } from '@core/services/thermal.service';
import { DownloadReportService } from '@core/services/download-report.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit, OnDestroy {
  public plantaFija = true;
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public notSharedReport = true;
  public showFilters = true;
  public mapLoaded = false;
  noAnomsReport = false;
  thereAreZones = true;

  private subscriptions: Subscription = new Subscription();

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(
    private reportControlService: ReportControlService,
    private statsService: StatsService,
    private olMapService: OlMapService,
    private thermalService: ThermalService,
    private downloadReportService: DownloadReportService
  ) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => (this.anomaliasLoaded = res));

    this.subscriptions.add(
      this.reportControlService.sharedReportWithFilters$.subscribe((value) => (this.showFilters = value))
    );
    this.subscriptions.add(
      this.reportControlService.sharedReport$.subscribe((value) => (this.notSharedReport = !value))
    );
    this.subscriptions.add(
      this.reportControlService.mapLoaded$.subscribe((value) => {
        this.mapLoaded = value;

        if (this.mapLoaded) {
          this.statsService.setSidenav(this.sidenavStats);
        }
      })
    );

    this.subscriptions.add(this.reportControlService.thereAreZones$.subscribe((value) => (this.thereAreZones = value)));

    this.subscriptions.add(this.reportControlService.noAnomsReport$.subscribe((value) => (this.noAnomsReport = value)));
  }

  showControls() {
    if (document.getElementById('map-control').style.display === 'none') {
      document.getElementById('map-control').style.display = 'unset';
    } else {
      document.getElementById('map-control').style.display = 'none';
    }
  }

  loadStats() {
    this.statsService.loadStats = true;
  }

  ngOnDestroy(): void {
    // nos desuscribimos de los observables
    this.subscriptions.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.reportControlService.resetService();
    this.olMapService.resetService();
    this.thermalService.resetService();
    this.downloadReportService.resetService();
  }
}
