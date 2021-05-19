import { Component, OnInit } from '@angular/core';
import { Anomalia } from '@core/models/anomalia';

import { SeguidorViewService } from '../../services/seguidor-view.service';

@Component({
  selector: 'app-seguidor-anomalia-info',
  templateUrl: './seguidor-anomalia-info.component.html',
  styleUrls: ['./seguidor-anomalia-info.component.css'],
})
export class SeguidorAnomaliaInfoComponent implements OnInit {
  anomaliaSelected: Anomalia = undefined;

  constructor(private seguidorViewService: SeguidorViewService) {}

  ngOnInit(): void {
    this.seguidorViewService.anomaliaSelected$.subscribe((anom) => (this.anomaliaSelected = anom));
  }
}
