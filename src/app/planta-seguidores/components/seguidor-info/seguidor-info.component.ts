import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { SeguidoresControlService } from '../../services/seguidores-control.service';

import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-seguidor-info',
  templateUrl: './seguidor-info.component.html',
  styleUrls: ['./seguidor-info.component.css'],
})
export class SeguidorInfoComponent implements OnInit, OnDestroy {
  numAnomalias: number;
  seguidorHovered: Seguidor;

  private subscriptions: Subscription = new Subscription();

  constructor(private seguidoresControlService: SeguidoresControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidoresControlService.seguidorHovered$.subscribe((seguidor) => {
        this.seguidorHovered = seguidor;

        if (this.seguidorHovered !== undefined) {
          // tslint:disable-next-line: triple-equals
          this.numAnomalias = this.seguidorHovered.anomalias.filter((anom) => anom.tipo != 0).length;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
