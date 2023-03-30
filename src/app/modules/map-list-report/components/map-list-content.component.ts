import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ZonesService } from '@data/services/zones.service';
import { ResetServices } from '@data/services/reset-services.service';

@Component({
  selector: 'app-map-list-content',
  templateUrl: './map-list-content.component.html',
  styleUrls: ['./map-list-content.component.css'],
})
export class MapListContentComponent implements OnInit, OnDestroy {
  thereAreZones = true;

  private subscriptions: Subscription = new Subscription();

  constructor(private zonesService: ZonesService, private resetServicesService: ResetServices) {}

  ngOnInit(): void {
    this.subscriptions.add(this.zonesService.thereAreZones$.subscribe((value) => (this.thereAreZones = value)));
  }

  ngOnDestroy(): void {
    // nos desuscribimos de los observables
    this.subscriptions.unsubscribe();

    // reseteamos los servicios a sus valores por defecto
    this.resetServicesService.resetServices();
  }
}
