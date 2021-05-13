import { Component, OnInit } from '@angular/core';

import { MapSeguidoresService } from '../../services/map-seguidores.service';

@Component({
  selector: 'app-view-toggle',
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.css'],
})
export class ViewToggleComponent implements OnInit {
  viewSelected: boolean[] = [true, false, false];

  constructor(private mapSeguidoresService: MapSeguidoresService) {}

  ngOnInit(): void {}

  onToggleChange(value) {
    this.mapSeguidoresService.toggleViewSelected = value;
  }
}
