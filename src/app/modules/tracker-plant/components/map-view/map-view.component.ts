import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { ReportControlService } from '@data/services/report-control.service';
import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { StatsService } from '@data/services/stats.service';
import { OlMapService } from '@data/services/ol-map.service';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { ZonesService } from '@data/services/zones.service';
import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  public rightOpened = false;
  public statsOpened: boolean;
  public seguidorViewOpened: boolean;
  public seguidoresLoaded = false;
  public notSharedReport = true;
  completeView = false;
  public showFilters = true;
  thereAreZones = true;
  public mapLoaded = false;
  noAnomsReport = false;
  generatingDownload = false;
  numInformes = 1;

  private subscriptions: Subscription = new Subscription();

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;
  @ViewChild('sidenavSeguidorView') sidenavSeguidorView: MatSidenav;

  constructor(
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService,
    private statsService: StatsService,
    private olMapService: OlMapService,
    private mapSeguidoresService: MapSeguidoresService,
    private downloadReportService: DownloadReportService,
    private zonesService: ZonesService,
    private viewReportService: ViewReportService
  ) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.seguidoresLoaded = res;

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
      this.seguidoresControlService.seguidorViewOpened$.subscribe((opened) => (this.seguidorViewOpened = opened))
    );

    this.subscriptions.add(this.zonesService.thereAreZones$.subscribe((value) => (this.thereAreZones = value)));

    this.subscriptions.add(
      this.reportControlService.mapLoaded$.subscribe((value) => {
        this.mapLoaded = value;

        if (this.mapLoaded) {
          this.statsService.setSidenav(this.sidenavStats);
        }
      })
    );

    this.subscriptions.add(this.reportControlService.noAnomsReport$.subscribe((value) => (this.noAnomsReport = value)));

    this.subscriptions.add(
      this.downloadReportService.generatingDownload$.subscribe((value) => (this.generatingDownload = value))
    );
  }

  ngAfterViewInit(): void {
    this.seguidorViewService.sidenav = this.sidenavSeguidorView;
  }

  loadStats() {
    this.statsService.loadStats = true;
  }

  resetSeguidorView() {
    this.seguidorViewService.resetViewValues();
  }

  ngOnDestroy(): void {
    // cancelamos las suscripciones
    this.subscriptions.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.reportControlService.resetService();
    this.olMapService.resetService();
    this.seguidorViewService.sidenav = undefined;
    this.mapSeguidoresService.resetService();
    this.downloadReportService.resetService();
    this.viewReportService.resetService();
  }
}
