import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';

import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';
import { PcInterface } from '@core/models/pc';

@Component({
  selector: 'app-seguidor-view-navbar',
  templateUrl: './seguidor-view-navbar.component.html',
  styleUrls: ['./seguidor-view-navbar.component.css'],
})
export class SeguidorViewNavbarComponent implements OnInit {
  seguidorSelected: Seguidor = undefined;
  anomaliaSelected: Anomalia = undefined;
  meteoInfo: any;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => (this.seguidorSelected = seguidor))
    );

    this.subscriptions.add(
      this.seguidorViewService.anomaliaSelected$.subscribe((anom) => {
        this.anomaliaSelected = anom;

        if (this.anomaliaSelected !== undefined) {
          this.meteoInfo = {
            // irradiancia: this.anomaliaSelected.irradiancia,
            // vientoDireccion: this.anomaliaSelected.vientoDireccion,
            // vientoVelocidad: this.anomaliaSelected.vientoVelocidad,
            // temperaturaAire: (this.anomaliaSelected as PcInterface).temperaturaAire,
            // nubosidad: (this.anomaliaSelected as PcInterface).nubosidad,
            irradiancia: 200,
            vientoDireccion: 45,
            vientoVelocidad: 60,
            temperaturaAire: 25,
            nubosidad: 2,
          };
        }
      })
    );
  }

  public closeSidenav() {
    this.seguidorViewService.closeSidenav();

    // reseteamos los valores de la vista seguidor
    this.seguidorViewService.resetViewValues();
  }
}
