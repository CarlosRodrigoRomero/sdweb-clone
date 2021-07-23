import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { MapSeguidoresService } from '../../services/map-seguidores.service';

@Component({
  selector: 'app-view-toggle',
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.css'],
})
export class ViewToggleComponent implements OnInit, OnDestroy {
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
