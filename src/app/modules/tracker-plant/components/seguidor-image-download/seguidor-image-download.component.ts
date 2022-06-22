import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { SeguidorService } from '@data/services/seguidor.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { SeguidoresControlService } from '@data/services/seguidores-control.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-seguidor-image-download',
  templateUrl: './seguidor-image-download.component.html',
  styleUrls: ['./seguidor-image-download.component.css'],
})
export class SeguidorImageDownloadComponent implements OnInit, OnDestroy {
  private anomaliaSelected: Anomalia;
  private seguidorSelected: Seguidor;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidorService: SeguidorService,
    private seguidorViewService: SeguidorViewService,
    private anomaliaService: AnomaliaService,
    private seguidoresControlService: SeguidoresControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidorViewService.anomaliaSelected$.subscribe((anomalia) => (this.anomaliaSelected = anomalia))
    );

    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => (this.seguidorSelected = seguidor))
    );
  }

  downloadRjpg() {
    let anomalia = this.anomaliaSelected;
    if (this.anomaliaSelected === undefined) {
      anomalia = this.seguidorSelected.anomalias[0];
    }
    this.anomaliaService.downloadImage('jpg', anomalia);
  }

  downloadJpgVisual() {
    let anomalia = this.anomaliaSelected;
    if (this.anomaliaSelected === undefined) {
      anomalia = this.seguidorSelected.anomalias[0];
    }
    this.anomaliaService.downloadImage('jpgVisual', anomalia);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
