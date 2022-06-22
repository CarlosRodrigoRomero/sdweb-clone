import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { ReportControlService } from '@data/services/report-control.service';
import { StatsService } from '@data/services/stats.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { ZonesService } from '@data/services/zones.service';
import { ResetServices } from '@data/services/reset-services.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit, OnDestroy {
  public plantaFija = true;
  public rightOpened = false;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public notSharedReport = true;
  completeView = false;
  public showFilters = true;
  public mapLoaded = false;
  noAnomsReport = false;
  thereAreZones = true;
  generatingDownload = false;
  selectedInformeId: string;
  numInformes = 1;

  private subscriptions: Subscription = new Subscription();

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(
    private reportControlService: ReportControlService,
    private statsService: StatsService,
    private downloadReportService: DownloadReportService,
    private zonesService: ZonesService,
    private resetServicesService: ResetServices
  ) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;

      this.numInformes = this.reportControlService.informes.length;
    });

    this.subscriptions.add(
      this.reportControlService.sharedReportWithFilters$.subscribe((value) => (this.showFilters = value))
    );
    this.subscriptions.add(
      this.reportControlService.sharedReport$.subscribe((value) => (this.notSharedReport = !value))
    );

    this.subscriptions.add(this.reportControlService.completeView$.subscribe((value) => (this.completeView = value)));

    this.subscriptions.add(
      this.reportControlService.mapLoaded$.subscribe((value) => {
        this.mapLoaded = value;

        if (this.mapLoaded) {
          this.statsService.setSidenav(this.sidenavStats);
        }
      })
    );

    this.subscriptions.add(this.zonesService.thereAreZones$.subscribe((value) => (this.thereAreZones = value)));

    this.subscriptions.add(this.reportControlService.noAnomsReport$.subscribe((value) => (this.noAnomsReport = value)));

    this.subscriptions.add(
      this.downloadReportService.generatingDownload$.subscribe((value) => (this.generatingDownload = value))
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );
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
    this.resetServicesService.resetServices();
  }
}
