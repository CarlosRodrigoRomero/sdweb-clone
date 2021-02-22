import { Component, OnInit } from '@angular/core';
import { MapControlService } from '../../services/map-control.service';
import { switchMap } from 'rxjs/operators';
import { InformeService } from '@core/services/informe.service';
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

  constructor(private mapControl: MapControlService, private informeService: InformeService) {}

  ngOnInit(): void {
    this.mapControl.selectedInformeId$
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
