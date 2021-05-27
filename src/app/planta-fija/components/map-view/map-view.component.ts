import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { ReportControlService } from '@core/services/report-control.service';
import { StatsService } from '@core/services/stats.service';

// planta prueba: egF0cbpXnnBnjcrusoeR
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
  private subscriptions: Subscription = new Subscription();

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(private reportControlService: ReportControlService, private statsService: StatsService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.initService().subscribe((value) => (this.anomaliasLoaded = value))
    );
    this.subscriptions.add(
      this.reportControlService.sharedReportWithFilters$.subscribe((value) => (this.showFilters = value))
    );
    this.subscriptions.add(
      this.reportControlService.sharedReport$.subscribe((value) => (this.notSharedReport = !value))
    );
  }

  ngOnDestroy(): void {
    // nos desuscribimos de los observables
    this.subscriptions.unsubscribe();
  }

  loadStats() {
    this.statsService.loadStats = true;
  }
}
