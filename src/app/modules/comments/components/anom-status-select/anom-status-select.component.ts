import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AnomaliaService } from '@data/services/anomalia.service';
import { PcService } from '@data/services/pc.service';
import { ReportControlService } from '@data/services/report-control.service';

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-anom-status-select',
  templateUrl: './anom-status-select.component.html',
  styleUrls: ['./anom-status-select.component.css'],
})
export class AnomStatusSelectComponent implements OnInit {
  @Input() anomaliaSelected: Anomalia;

  form: FormGroup;
  selectedStatus: string;
  status: string[] = ['pendiente', 'revisada', 'reparada'];

  constructor(
    private formBuilder: FormBuilder,
    private reportControlService: ReportControlService,
    private pcService: PcService,
    private anomaliaService: AnomaliaService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('anomaliaSelected')) {
      if (this.anomaliaSelected !== undefined) {
        if (this.anomaliaSelected.hasOwnProperty('status')) {
          this.selectedStatus = this.anomaliaSelected.status;
        } else {
          this.selectedStatus = 'pendiente';
        }

        this.form.patchValue({ status: this.selectedStatus });
      }
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      status: [, Validators.required],
    });
  }

  changeStatus() {
    if (this.form.valid) {
      if (this.reportControlService.plantaFija) {
        this.updateAnomalia(this.form.get('status').value, 'status');
      } else {
        this.updatePc(this.form.get('status').value, 'status');
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
}
