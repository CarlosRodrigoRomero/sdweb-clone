import { Component, OnInit } from '@angular/core';

import { switchMap } from 'rxjs/operators';

import { InformeService } from '@core/services/informe.service';
import { MapControlService } from '../../services/map-control.service';
import { ReportControlService } from '@core/services/report-control.service';

import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-barra-resumen-planta',
  templateUrl: './barra-resumen-planta.component.html',
  styleUrls: ['./barra-resumen-planta.component.css'],
})
export class BarraResumenPlantaComponent implements OnInit {
  nombrePlanta = 'Planta demo';
  potenciaPlanta = 1;
  tipoPlanta = 'fija';
  public informe: InformeInterface = null;

  constructor(
    private mapControl: MapControlService,
    private informeService: InformeService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.reportControlService.selectedInformeId$
      .pipe(
        switchMap((informeId) => {
          return this.informeService.getInforme(informeId);
        })
      )
      .subscribe((informe) => {
        this.informe = informe;
      });
  }
}
