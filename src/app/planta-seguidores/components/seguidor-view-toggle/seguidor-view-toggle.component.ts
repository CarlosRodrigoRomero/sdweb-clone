import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { MapSeguidoresService } from '../../services/map-seguidores.service';

@Component({
  selector: 'app-seguidor-view-toggle',
  templateUrl: './seguidor-view-toggle.component.html',
  styleUrls: ['./seguidor-view-toggle.component.css'],
})
export class SeguidorViewToggleComponent implements OnInit, OnDestroy {
  viewSelected: number;

  private subscriptions: Subscription = new Subscription();

  constructor(private mapSeguidoresService: MapSeguidoresService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.mapSeguidoresService.toggleViewSelected$.subscribe((view) => (this.viewSelected = view))
    );
  }

  onToggleChange(value) {
    this.mapSeguidoresService.toggleViewSelected = value;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
