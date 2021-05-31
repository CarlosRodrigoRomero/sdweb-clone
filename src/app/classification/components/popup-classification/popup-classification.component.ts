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
  formControl = new FormControl(8, [Validators.min(1), Validators.max(19)]);
  showDeleteLabel = false;

  constructor(private classificationService: ClassificationService, private anomaliaService: AnomaliaService) {}

  ngOnInit(): void {
    this.classificationService.normModSelected$.subscribe((normMod) => (this.normModSelected = normMod));
    this.classificationService.anomaliaSelected$.subscribe((anomalia) => {
      this.anomaliaSelected = anomalia;

      if (this.anomaliaSelected !== undefined && this.anomaliaSelected !== null) {
        // conectamos el input con el tipo
        this.formControl.setValue(this.anomaliaSelected.tipo);

        // ocultamos el aviso de aliminacion
        this.showDeleteLabel = false;
      }
    });
  }

  updateAnomalia() {
    this.classificationService.anomaliaSelected.tipo = this.formControl.value;

    // actualizamos el tipo en la DB
    this.anomaliaService.updateAnomalia(this.anomaliaSelected);
  }

  deleteAnomalia() {
    // mostramos el aviso de eliminacion
    this.showDeleteLabel = true;

    // eliminamos la anomalia de la DB
    this.anomaliaService.deleteAnomalia(this.anomaliaSelected);

    this.classificationService.anomaliaSelected = undefined;
  }
}
