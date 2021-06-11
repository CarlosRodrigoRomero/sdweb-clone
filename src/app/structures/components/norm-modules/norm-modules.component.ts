import { Component, OnInit } from '@angular/core';

import Map from 'ol/Map';

import { OlMapService } from '@core/services/ol-map.service';
import { StructuresService } from '@core/services/structures.service';

@Component({
  selector: 'app-norm-modules',
  templateUrl: './norm-modules.component.html',
  styleUrls: ['./norm-modules.component.css'],
})
export class NormModulesComponent implements OnInit {
  private map: Map;

  constructor(private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.olMapService.map$.subscribe((map) => (this.map = map));
  }
}
