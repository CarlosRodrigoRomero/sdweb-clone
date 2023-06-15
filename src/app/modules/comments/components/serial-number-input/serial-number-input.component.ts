import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AnomaliaService } from '@data/services/anomalia.service';
import { PcService } from '@data/services/pc.service';
import { ReportControlService } from '@data/services/report-control.service';

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-serial-number-input',
  templateUrl: './serial-number-input.component.html',
  styleUrls: ['./serial-number-input.component.css'],
})
export class SerialNumberInputComponent implements OnInit {
  @Input() anomaliaSelected: Anomalia;

  editInput = false;
  form: FormGroup;

  constructor(
    private reportControlService: ReportControlService,
    private pcService: PcService,
    private anomaliaService: AnomaliaService,
    private formBuilder: FormBuilder
  ) {
    this.buildForm();
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('anomaliaSelected')) {
      // volvemos el input no editable al cambiar de anomalía
      this.editInput = false;

      if (this.anomaliaSelected !== undefined) {
        if (this.anomaliaSelected.hasOwnProperty('numeroSerie')) {
          this.form.patchValue({ numeroSerie: this.anomaliaSelected.numeroSerie });
        } else {
          this.form.patchValue({ numeroSerie: null });
        }
      }
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      if (this.form.get('numeroSerie').value !== null) {
        if (this.reportControlService.plantaFija) {
          this.updateAnomalia(this.form.get('numeroSerie').value, 'numeroSerie');
        } else {
          this.updatePc(this.form.get('numeroSerie').value, 'numeroSerie');
        }

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

  updatePc(value: any, field: string) {
    // la actualizamos en la anomalía local
    this.anomaliaSelected[field] = value;
    // la actualizamos en la DB
    this.pcService.updatePcField(this.anomaliaSelected.id, field, value);
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      numeroSerie: [, Validators.required],
    });
  }
}
