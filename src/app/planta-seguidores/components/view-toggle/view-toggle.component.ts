import { Component, OnInit } from '@angular/core';

import { MapSeguidoresService } from '../../services/map-seguidores.service';

@Component({
  selector: 'app-view-toggle',
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.css'],
})
export class ViewToggleComponent implements OnInit {
  constructor(private mapSeguidoresService: MapSeguidoresService) {}

  ngOnInit(): void {}

  onToggleChange(value) {
    this.mapSeguidoresService.toggleView = value;
  }
}
