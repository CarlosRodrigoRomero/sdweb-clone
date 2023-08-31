import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { ZonesService } from '@data/services/zones.service';

@Component({
  selector: 'app-layers-panel',
  templateUrl: './layers-panel.component.html',
  styleUrls: ['./layers-panel.component.css'],
})
export class LayersPanelComponent implements OnInit, OnDestroy {
  thereAreLargestZones = false;
  showThermalLayer = true;

  private subscriptions: Subscription = new Subscription();

  constructor(private zonesService: ZonesService, private router: Router) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.zonesService.thereAreLargestZones$.subscribe((value) => (this.thereAreLargestZones = value))
    );

    if (this.router.url.split('/').includes('tracker') || this.router.url.split('/').includes('rooftop')) {
      this.showThermalLayer = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
