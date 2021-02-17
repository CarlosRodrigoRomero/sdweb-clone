import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { MatSidenav } from '@angular/material/sidenav';

import { FilterService } from '@core/services/filter.service';

// planta prueba: egF0cbpXnnBnjcrusoeR
@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit {
  public plantaId: string;
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public sharedReport = false;

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(private filterService: FilterService, private router: Router) {
    if (this.router.url.includes('shared')) {
      this.sharedReport = true;
    }
  }

  ngOnInit(): void {
    this.plantaId = 'egF0cbpXnnBnjcrusoeR';

    this.filterService.initFilterService(this.plantaId, 'planta').subscribe((v) => {
      this.anomaliasLoaded = v;
    });
  }
}
