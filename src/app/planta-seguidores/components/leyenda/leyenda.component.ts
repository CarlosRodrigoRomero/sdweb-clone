import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '@core/services/global';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';

@Component({
  selector: 'app-leyenda',
  templateUrl: './leyenda.component.html',
  styleUrls: ['./leyenda.component.css'],
})
export class LeyendaComponent implements OnInit {
  colors = GLOBAL.colores_mae;
  viewSelected: number;
  viewsLevels: number[][];

  constructor(
    private mapSeguidoresService: MapSeguidoresService,
    private seguidoresControlService: SeguidoresControlService
  ) {}

  ngOnInit(): void {
    this.viewsLevels = [
      this.seguidoresControlService.maeLevels,
      this.seguidoresControlService.ccLevels,
      this.seguidoresControlService.gradLevels,
    ];

    this.mapSeguidoresService.toggleViewSelected$.subscribe((view) => (this.viewSelected = view));
  }
}
