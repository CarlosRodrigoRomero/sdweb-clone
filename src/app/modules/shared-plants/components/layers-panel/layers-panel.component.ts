import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ZonesService } from '@data/services/zones.service';

@Component({
  selector: 'app-layers-panel',
  templateUrl: './layers-panel.component.html',
  styleUrls: ['./layers-panel.component.css'],
})
export class LayersPanelComponent implements OnInit, OnDestroy {
  thereAreLargestZones = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private zonesService: ZonesService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.zonesService.thereAreLargestZones$.subscribe((value) => (this.thereAreLargestZones = value))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
