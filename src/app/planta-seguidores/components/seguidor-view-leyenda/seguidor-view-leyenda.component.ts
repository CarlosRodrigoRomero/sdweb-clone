import { Component, OnDestroy, OnInit } from '@angular/core';
import { Seguidor } from '@core/models/seguidor';

import { Subscription } from 'rxjs';

import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { GLOBAL } from '@core/services/global';

@Component({
  selector: 'app-seguidor-view-leyenda',
  templateUrl: './seguidor-view-leyenda.component.html',
  styleUrls: ['./seguidor-view-leyenda.component.css'],
})
export class SeguidorViewLeyendaComponent implements OnInit, OnDestroy {
  viewSelected: number;
  private seguidorSelected: Seguidor;
  viewsTitle: string[] = ['Pérdidas', 'Cels. Calientes', 'ΔT Max (norm)'];
  numCelsCalientes = 0;
  colors = GLOBAL.colores_mae;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private mapSeguidoresService: MapSeguidoresService,
    private seguidoresControlService: SeguidoresControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.mapSeguidoresService.toggleViewSelected$.subscribe((view) => {
        this.viewSelected = view;

        if (this.seguidorSelected !== undefined) {
          this.numCelsCalientes = this.seguidorSelected.anomaliasCliente.filter(
            // tslint:disable-next-line: triple-equals
            (anom) => anom.tipo == 8 || anom.tipo == 9
          ).length;
        }
      })
    );

    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
        this.seguidorSelected = seguidor;

        if (this.seguidorSelected !== undefined && this.seguidorSelected !== null) {
          this.numCelsCalientes = this.seguidorSelected.anomaliasCliente.filter(
            // tslint:disable-next-line: triple-equals
            (anom) => anom.tipo == 8 || anom.tipo == 9
          ).length;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
