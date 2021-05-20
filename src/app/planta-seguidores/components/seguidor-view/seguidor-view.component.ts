import { Component, OnInit } from '@angular/core';

import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';

import { Seguidor } from '@core/models/seguidor';
@Component({
  selector: 'app-seguidor-view',
  templateUrl: './seguidor-view.component.html',
  styleUrls: ['./seguidor-view.component.css'],
})
export class SeguidorViewComponent implements OnInit {
  public seguidorSelected: Seguidor = undefined;

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService
  ) {}

  ngOnInit(): void {
    this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
      this.seguidorSelected = seguidor;

      if (this.seguidorSelected !== undefined) {
        if (this.seguidorSelected.anomalias.length > 0) {
          this.seguidorViewService.anomaliaSelected = this.seguidorSelected.anomalias[0];
        }
      }
    });
  }

  public closeSidenav() {
    this.seguidorViewService.closeSidenav();
  }
}
