import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ZonesService } from '@data/services/zones.service';
import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-layers-panel',
  templateUrl: './layers-panel.component.html',
  styleUrls: ['./layers-panel.component.css'],
})
export class LayersPanelComponent implements OnInit, OnDestroy {
  thereAreLargestZones = false;
  showThermalLayer = true;

  private subscriptions: Subscription = new Subscription();

  constructor(private zonesService: ZonesService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.zonesService.thereAreLargestZones$.subscribe((value) => (this.thereAreLargestZones = value))
    );

    this.showThermalLayer = this.reportControlService.plantaFija;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
