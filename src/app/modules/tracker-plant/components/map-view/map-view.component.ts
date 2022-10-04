import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ComponentFactoryResolver } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { StatsService } from '@data/services/stats.service';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { DownloadReportService } from '@data/services/download-report.service';
import { ZonesService } from '@data/services/zones.service';
import { ResetServices } from '@data/services/reset-services.service';
import { ViewReportService } from '@data/services/view-report.service';

import { DynamicStatsDirective } from '@modules/stats-plant/directives/dynamic-stats.directive';

import { PlantaStatsComponent } from '@modules/stats-plant/components/planta-stats.component';

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
  thereAreLargestZones = false;

  private subscriptions: Subscription = new Subscription();

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;
  @ViewChild('sidenavSeguidorView') sidenavSeguidorView: MatSidenav;

  @ViewChild(DynamicStatsDirective) dynamicStats: DynamicStatsDirective;

  constructor(
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService,
    private statsService: StatsService,
    private mapSeguidoresService: MapSeguidoresService,
    private downloadReportService: DownloadReportService,
    private zonesService: ZonesService,
    private resetServices: ResetServices,
    private componentFactoryResolver: ComponentFactoryResolver,
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
      this.zonesService.thereAreLargestZones$.subscribe((value) => (this.thereAreLargestZones = value))
    );

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
    const component = this.componentFactoryResolver.resolveComponentFactory(PlantaStatsComponent);

    this.dynamicStats.viewContainerRef.clear();
    this.dynamicStats.viewContainerRef.createComponent(component);
  }

  resetSeguidorView() {
    this.seguidorViewService.resetViewValues();
  }

  ngOnDestroy(): void {
    // cancelamos las suscripciones
    this.subscriptions.unsubscribe();

    this.seguidorViewService.sidenav = undefined;

    // reseteamos los servicios a sus valores por defecto
    this.resetServices.resetServices();
    this.mapSeguidoresService.resetService();
  }
}
