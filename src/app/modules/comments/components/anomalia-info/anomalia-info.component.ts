import { Component, OnInit } from '@angular/core';

import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { Anomalia } from '@core/models/anomalia';

interface AnomaliaInfo {
  numAnom: number;
}

@Component({
  selector: 'app-anomalia-info',
  templateUrl: './anomalia-info.component.html',
  styleUrls: ['./anomalia-info.component.css'],
})
export class AnomaliaInfoComponent implements OnInit {
  anomaliaSelected: Anomalia;
  anomaliaInfo: AnomaliaInfo = undefined;

  constructor(private comentariosControlService: ComentariosControlService) {}

  ngOnInit(): void {
    this.comentariosControlService.anomaliaSelected$.subscribe((anom) => {
      this.anomaliaSelected = anom;

      if (this.anomaliaSelected !== undefined) {
        this.anomaliaInfo = {
          numAnom: this.anomaliaSelected.numAnom,
        };
      }
    });
  }
}
