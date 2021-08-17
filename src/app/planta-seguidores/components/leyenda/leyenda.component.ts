import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { GLOBAL } from '@core/services/global';

@Component({
  selector: 'app-leyenda',
  templateUrl: './leyenda.component.html',
  styleUrls: ['./leyenda.component.css'],
})
export class LeyendaComponent implements OnInit, OnDestroy {
  colors = GLOBAL.colores_mae;
  viewSelected: number;
  viewsLabels: string[][];
  viewsTitle: string[] = ['MAE por seguidor', 'Cels. Calientes por seguidor', 'ΔT Max (norm) por seguidor'];

  private subscriptions: Subscription = new Subscription();

  constructor(private mapSeguidoresService: MapSeguidoresService) {}

  ngOnInit(): void {
    this.viewsLabels = [
      ['Bueno', 'En la media', 'Mejorable'],
      ['Bueno', 'En la media', 'Mejorable'],
      ['Leve', 'Medio', 'Grave'],
    ];

    this.subscriptions.add(
      this.mapSeguidoresService.toggleViewSelected$.subscribe((view) => (this.viewSelected = view))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
