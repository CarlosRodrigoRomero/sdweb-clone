import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { ReportControlService } from '@core/services/report-control.service';
import { Subscription } from 'rxjs';

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

  private susInitService: Subscription;
  private susSharedWithFilters: Subscription;
  private susSharedReport: Subscription;

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.susInitService = this.reportControlService.initService().subscribe((value) => (this.anomaliasLoaded = value));
    this.susSharedWithFilters = this.reportControlService.sharedReportWithFilters$.subscribe((value) => {
      this.showFilters = value;
    });
    this.susSharedReport = this.reportControlService.sharedReport$.subscribe(
      (value) => (this.notSharedReport = !value)
    );
  }

  ngOnDestroy(): void {
    // nos desuscribimos de los observables
    this.susInitService.unsubscribe();
    this.susSharedWithFilters.unsubscribe();
    this.susSharedReport.unsubscribe();
  }
}
