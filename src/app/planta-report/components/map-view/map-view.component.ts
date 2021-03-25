import { Component, OnInit, ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav';

import { ReportFijaControlService } from '../../services/report-fija-control.service';

// planta prueba: egF0cbpXnnBnjcrusoeR
@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit {
  public plantaFija = true;
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public showFilters = true;
  public mapLoaded = false;

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(private reportFijaControlService: ReportFijaControlService) {}

  ngOnInit(): void {
    this.reportFijaControlService.initService().subscribe((v) => (this.anomaliasLoaded = v));
    this.reportFijaControlService.sharedReportWithFilters$.subscribe((v) => {
      console.log(v);
      this.showFilters = v;
    });
  }
}
