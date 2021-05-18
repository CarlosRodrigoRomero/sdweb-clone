import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { ReportControlService } from '@core/services/report-control.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public seguidorViewOpened: boolean;
  public seguidoresLoaded = false;
  public notSharedReport = true;
  public showFilters = true;
  private subscriptions: Subscription = new Subscription();

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;
  @ViewChild('sidenavSeguidorView') sidenavSeguidorView: MatSidenav;

  constructor(
    private reportControlService: ReportControlService,
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.initService().subscribe((value) => (this.seguidoresLoaded = value))
    );
    this.subscriptions.add(
      this.reportControlService.sharedReportWithFilters$.subscribe((value) => (this.showFilters = value))
    );
    this.subscriptions.add(
      this.reportControlService.sharedReport$.subscribe((value) => (this.notSharedReport = !value))
    );
    this.subscriptions.add(
      this.seguidoresControlService.seguidorViewOpened$.subscribe((opened) => (this.seguidorViewOpened = opened))
    );
  }

  ngAfterViewInit(): void {
    this.seguidorViewService.setSidenav(this.sidenavSeguidorView);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
