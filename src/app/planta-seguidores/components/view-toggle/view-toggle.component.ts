import { Component, OnInit } from '@angular/core';

import { MapSeguidoresService } from '../../services/map-seguidores.service';

@Component({
  selector: 'app-view-toggle',
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.css'],
})
export class ViewToggleComponent implements OnInit {
  viewSelected: number;

  constructor(private mapSeguidoresService: MapSeguidoresService) {}

  ngOnInit(): void {
    this.mapSeguidoresService.toggleViewSelected$.subscribe((view) => (this.viewSelected = view));
  }

  onToggleChange(value) {
    this.mapSeguidoresService.toggleViewSelected = value;
  }
}
