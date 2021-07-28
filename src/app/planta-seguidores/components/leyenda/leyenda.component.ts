import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '@core/services/global';

import { MapSeguidoresService } from '../../services/map-seguidores.service';

@Component({
  selector: 'app-leyenda',
  templateUrl: './leyenda.component.html',
  styleUrls: ['./leyenda.component.css'],
})
export class LeyendaComponent implements OnInit {
  colors = GLOBAL.colores_mae;
  viewSelected: number;

  constructor(private mapSeguidoresService: MapSeguidoresService) {}

  ngOnInit(): void {
    this.mapSeguidoresService.toggleViewSelected$.subscribe((view) => (this.viewSelected = view));
  }
}
