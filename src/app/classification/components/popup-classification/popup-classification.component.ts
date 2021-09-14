import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ClassificationService } from '@core/services/classification.service';
import { AnomaliaService } from '@core/services/anomalia.service';

import { NormalizedModule } from '@core/models/normalizedModule';
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-popup-classification',
  templateUrl: './popup-classification.component.html',
  styleUrls: ['./popup-classification.component.css'],
})
export class PopupClassificationComponent implements OnInit {
  normModSelected: NormalizedModule;
  anomaliaSelected: Anomalia;
  form = new FormGroup({});
  formControl = new FormControl(8, [Validators.min(3), Validators.max(19)]);

  constructor(private classificationService: ClassificationService, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.classificationService.normModSelected$.subscribe((normMod) => (this.normModSelected = normMod));
    this.classificationService.anomaliaSelected$.subscribe((anomalia) => {
      this.anomaliaSelected = anomalia;

      if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
        // conectamos el input con el tipo
        this.formControl.setValue(this.anomaliaSelected.tipo);
      }
    });
  }

  updateAnomalia() {
    if (this.formControl.value >= 3 && this.formControl.value <= 19) {
      let tipo = this.formControl.value;
      if (tipo === 4) {
        // almacenamos el tipo 4 en desuso como 17
        tipo = 17;
      }
      this.classificationService.anomaliaSelected.tipo = tipo;

      // actualizamos la anomalia de la lista local
      this.updateAnomaliaLocal(tipo);

      // actualizamos el tipo en la DB
      this.anomaliaService.updateAnomalia(this.anomaliaSelected);
    }
  }

  private updateAnomaliaLocal(tipo: number) {
    this.classificationService.listaAnomalias.find((anom) => anom.id === this.anomaliaSelected.id).tipo = tipo;
  }

  deleteAnomalia() {
    // eliminamos la anomalia de la lista local
    this.deleteAnomaliaLocal(this.anomaliaSelected.id);

    // eliminamos la anomalia de la DB
    this.anomaliaService.deleteAnomalia(this.anomaliaSelected);

    this.classificationService.anomaliaSelected = undefined;

    // ocultamos el popup
    this.classificationService.hidePopup();
  }

  private deleteAnomaliaLocal(id: string) {
    this.classificationService.listaAnomalias = this.classificationService.listaAnomalias.filter(
      (anom) => anom.id !== id
    );
  }
}
