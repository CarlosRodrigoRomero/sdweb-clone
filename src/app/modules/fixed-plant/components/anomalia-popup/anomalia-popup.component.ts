import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { ReportControlService } from '@data/services/report-control.service';

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-anomalia-popup',
  templateUrl: './anomalia-popup.component.html',
  styleUrls: ['./anomalia-popup.component.css']
})
export class AnomaliaPopupComponent implements OnInit {

  numAnomalias: number;
  anomaliaHovered: Anomalia;
  localizacion: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.anomaliasControlService.anomaliaHover$.subscribe((anomalia) => {
        this.anomaliaHovered = anomalia;
        if (this.anomaliaHovered !== undefined) {
          this.localizacion = this.getLocalizacionLabel(this.anomaliaHovered);
        }
      })
    );
  }

  private getLocalizacionLabel(anomalia: Anomalia): string {
    let label = '';

    let globals = anomalia.globalCoords.filter((coord) => coord !== undefined && coord !== null && coord !== '');
    // quitamos la ultima global xq es la del seguidor
    // globals = globals.filter((g, index) => index < globals.length - 1);

    globals.forEach((coord, index) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        if (this.reportControlService.nombreGlobalCoords.length > 0) {
          const nombres = this.reportControlService.nombreGlobalCoords;
          label += `${nombres[index]}: ${coord}`;
        } else {
          label += `${coord}`;
        }
      }
      if (index < globals.length - 1) {
        label += ' / ';
      }
    });
    return label;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
