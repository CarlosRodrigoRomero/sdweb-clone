import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { ReportControlService } from '@data/services/report-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';

import { Anomalia } from '@core/models/anomalia';

interface AnomaliaInfo {
  numAnom: number;
  localizacion: string;
  tipo: string;
}

@Component({
  selector: 'app-anomalia-info',
  templateUrl: './anomalia-info.component.html',
  styleUrls: ['./anomalia-info.component.css'],
})
export class AnomaliaInfoComponent implements OnInit {
  anomaliaSelected: Anomalia;
  anomaliaInfo: AnomaliaInfo = undefined;
  editInput = false;
  form: FormGroup;
  localizacion: string;

  constructor(
    private comentariosControlService: ComentariosControlService,
    private anomaliaService: AnomaliaService,
    private formBuilder: FormBuilder,
    private anomaliaInfoService: AnomaliaInfoService,
    private reportControlService: ReportControlService,
    private olMapService: OlMapService,
    private anomaliasControlService: AnomaliasControlService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.comentariosControlService.anomaliaSelected$.subscribe((anom) => {
      this.anomaliaSelected = anom;

      // volvemos el input no editable al cambiar de anomalía
      this.editInput = false;

      if (this.anomaliaSelected !== undefined) {
        this.anomaliaInfo = {
          numAnom: this.anomaliaSelected.numAnom,
          localizacion: this.anomaliaInfoService.getLocalizacionCompleteLabel(
            this.anomaliaSelected,
            this.reportControlService.planta
          ),
          tipo: this.anomaliaInfoService.getTipoLabel(this.anomaliaSelected),
        };

        if (this.anomaliaSelected.hasOwnProperty('numeroSerie')) {
          this.form.patchValue({ numeroSerie: this.anomaliaSelected.numeroSerie });
        } else {
          this.form.patchValue({ numeroSerie: null });
        }
      }
    });
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      numeroSerie: [, Validators.required],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      if (this.form.get('numeroSerie').value !== null) {
        this.updateAnomalia(this.form.get('numeroSerie').value, 'numeroSerie');

        // volvemos el input a no editable
        this.editInput = false;
      }
    }
  }

  updateAnomalia(value: any, field: string) {
    // la actualizamos en la anomalía local
    this.anomaliaSelected[field] = value;
    // la actualizamos en la DB
    this.anomaliaService.updateAnomaliaField(this.anomaliaSelected.id, field, value);
  }

  goToAnomMap() {
    this.olMapService.setViewCenter(this.anomaliaSelected.featureCoords[0]);
    this.olMapService.setViewZoom(this.anomaliasControlService.zoomChangeView);

    this.comentariosControlService.infoOpened = false;
    this.comentariosControlService.listOpened = false;
  }
}
