import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { FilterService } from '@core/services/filter.service';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { IncrementosService } from '../../services/incrementos.service';
import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit {
  public plantaId: string;
  public plantaFija = false;
  private sharedId: string;
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public seguidoresLoaded = false;
  public notSharedReport = true;
  public showFilters = true;
  public sharedReport = false;
  private subscriptions: Subscription = new Subscription();

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(
    private filterService: FilterService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private mapSeguidoresService: MapSeguidoresService,
    private incrementosService: IncrementosService,
    private reportControlService: ReportControlService
  ) {
    /* if (this.router.url.includes('shared')) {
      this.sharedReport = true;
      this.activatedRoute.params.subscribe((params: Params) => (this.sharedId = params.id));
    }
    this.activatedRoute.params.subscribe((params: Params) => (this.plantaId = params.id)); */
  }

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

    // const initMapSegService = this.mapSeguidoresService.initService(this.plantaId);

    /* if (this.sharedReport) {
      const initFilterService = this.filterService.initService(
        this.sharedReport,
        this.plantaId,
        this.plantaFija,
        this.sharedId
      );

      combineLatest([initMapSegService, initFilterService]).subscribe(([mapSerInit, filtSerInit]) => {
        this.seguidoresLoaded = mapSerInit && filtSerInit;
        this.seguidoresLoaded$.next(this.seguidoresLoaded);
      });
    } else {
      const initFilterService = this.filterService.initService(this.sharedReport, this.plantaId, this.plantaFija);

      combineLatest([initMapSegService, initFilterService]).subscribe(([mapSerInit, filtSerInit]) => {
        this.seguidoresLoaded = mapSerInit && filtSerInit;
        this.seguidoresLoaded$.next(this.seguidoresLoaded);
      });
    } */
  }
}
