import { Component, Input, OnInit } from '@angular/core';

import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-seguidor-info',
  templateUrl: './seguidor-info.component.html',
  styleUrls: ['./seguidor-info.component.css'],
})
export class SeguidorInfoComponent implements OnInit {
  numAnomalias: number;

  @Input() seguidorHovered: Seguidor;

  constructor() {}

  ngOnInit(): void {
    // tslint:disable-next-line: triple-equals
    this.numAnomalias = this.seguidorHovered.anomalias.filter((anom) => anom.tipo != 0).length;
  }
}
