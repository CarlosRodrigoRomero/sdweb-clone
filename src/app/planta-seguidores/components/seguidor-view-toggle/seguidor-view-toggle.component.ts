import { Component, OnInit } from '@angular/core';

import { MapSeguidoresService } from '../../services/map-seguidores.service';

@Component({
  selector: 'app-seguidor-view-toggle',
  templateUrl: './seguidor-view-toggle.component.html',
  styleUrls: ['./seguidor-view-toggle.component.css'],
})
export class SeguidorViewToggleComponent implements OnInit {
  viewSelected: number;

  constructor(private mapSeguidoresService: MapSeguidoresService) {}

  ngOnInit(): void {
    this.mapSeguidoresService.toggleViewSelected$.subscribe((view) => (this.viewSelected = view));
  }

  onToggleChange(value) {
    this.mapSeguidoresService.toggleViewSelected = value;
  }
}
