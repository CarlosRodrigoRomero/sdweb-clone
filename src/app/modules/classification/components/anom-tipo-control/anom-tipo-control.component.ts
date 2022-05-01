import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { GLOBAL } from '@data/constants/global';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ClassificationService } from '@data/services/classification.service';

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-anom-tipo-control',
  templateUrl: './anom-tipo-control.component.html',
  styleUrls: ['./anom-tipo-control.component.css'],
})
export class AnomTipoLegendComponent implements OnInit, OnDestroy {
  tiposAnomalia: string[] = GLOBAL.labels_tipos;
  anomaliaColors: string[] = GLOBAL.colores_tipos;
  anomaliaSelected: Anomalia = undefined;

  private subscriptions: Subscription = new Subscription();

  constructor(private classificationService: ClassificationService, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.classificationService.anomaliaSelected$.subscribe((anom) => (this.anomaliaSelected = anom))
    );
  }

  updateAnomalia(tipo: number) {
    if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
      // asignamos el nuevo tipo a la anomalia seleccionada
      const anomalia = this.anomaliaSelected;
      anomalia.tipo = tipo;

      // actualizamos el tipo en la DB
      this.anomaliaService.updateAnomaliaField(anomalia.id, 'tipo', tipo);

      // reseteamos lo seleccionado
      this.classificationService.resetElemsSelected();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
