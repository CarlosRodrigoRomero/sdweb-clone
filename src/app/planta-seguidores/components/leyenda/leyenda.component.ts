import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { GLOBAL } from '@core/services/global';

@Component({
  selector: 'app-leyenda',
  templateUrl: './leyenda.component.html',
  styleUrls: ['./leyenda.component.css'],
})
export class LeyendaComponent implements OnInit, OnDestroy {
  colors = GLOBAL.colores_mae;
  viewSelected: number;
  viewsLevels: number[][];
  viewsTitle: string[] = ['MAE por seguidor', 'Cels. Calientes por seguidor', 'ΔT Max (norm) por seguidor'];

  private subscriptions: Subscription = new Subscription();

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

    this.subscriptions.add(
      this.mapSeguidoresService.toggleViewSelected$.subscribe((view) => (this.viewSelected = view))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
