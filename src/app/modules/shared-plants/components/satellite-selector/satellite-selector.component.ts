import { Component } from '@angular/core';

import { OlMapService } from '@data/services/ol-map.service';

@Component({
  selector: 'app-satellite-selector',
  templateUrl: './satellite-selector.component.html',
  styleUrls: ['./satellite-selector.component.css'],
})
export class SatelliteSelectorComponent {
  constructor(private olMapService: OlMapService) {}

  setSatelliteStatus(event: any) {
    this.olMapService.satelliteLayer.setVisible(event.checked);

    // la capa OSM la cambiamos al estado opuesto a la satelite
    this.olMapService.osmLayer.setVisible(!event.checked);
  }
}
