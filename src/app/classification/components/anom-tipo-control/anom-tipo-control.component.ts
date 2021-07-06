import { Component, OnInit } from '@angular/core';

import { GLOBAL } from '@core/services/global';
import { AnomaliaService } from '@core/services/anomalia.service';
import { ClassificationService } from '@core/services/classification.service';

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-anom-tipo-control',
  templateUrl: './anom-tipo-control.component.html',
  styleUrls: ['./anom-tipo-control.component.css'],
})
export class AnomTipoLegendComponent implements OnInit {
  tiposAnomalia: string[] = GLOBAL.labels_tipos;
  anomaliaColors: string[] = GLOBAL.colores_tipos;
  anomaliaSelected: Anomalia = undefined;

  constructor(private classificationService: ClassificationService, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.classificationService.anomaliaSelected$.subscribe((anom) => (this.anomaliaSelected = anom));
  }

  updateAnomalia(tipo: number) {
    if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
      // asignamos el nuevo tipo a la anomalia seleccionada
      const anomalia = this.anomaliaSelected;
      anomalia.tipo = tipo;
      // actualizamos el tipo en la DB
      this.anomaliaService.updateAnomalia(anomalia);

      // ocultamos el popup
      this.classificationService.hidePopup();
    }
  }
}
