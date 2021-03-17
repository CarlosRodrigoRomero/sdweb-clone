import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { MatSidenav } from '@angular/material/sidenav';

import { FilterService } from '@core/services/filter.service';
import { PlantaService } from '@core/services/planta.service';

// planta prueba: egF0cbpXnnBnjcrusoeR
@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit {
  public plantaId: string;
  public plantaFija = true;
  private sharedId: string;
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public sharedReport = false;

  @ViewChild('sidenavLeft') sidenavLeft: MatSidenav;
  @ViewChild('sidenavRight') sidenavRight: MatSidenav;
  @ViewChild('sidenavStats') sidenavStats: MatSidenav;

  constructor(
    private filterService: FilterService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    // this.plantaId = 'egF0cbpXnnBnjcrusoeR';
    
    if (this.router.url.includes('shared')) {
      this.sharedReport = true;
      this.activatedRoute.params.subscribe((params: Params) => (this.sharedId = params.id));
    }
    this.activatedRoute.params.subscribe((params: Params) => (this.plantaId = params.id));

    if (this.sharedReport) {
      this.filterService
        .initFilterService(this.sharedReport, this.plantaId, this.plantaFija, this.sharedId)
        .subscribe((v) => {
          this.anomaliasLoaded = v;
        });
    } else {
      this.filterService.initFilterService(this.sharedReport, this.plantaId, this.plantaFija).subscribe((v) => {
        this.anomaliasLoaded = v;
      });
    }
  }
}
