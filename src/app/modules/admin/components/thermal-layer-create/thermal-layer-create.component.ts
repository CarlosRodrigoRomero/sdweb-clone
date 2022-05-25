import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';

import { InformeService } from '@data/services/informe.service';
import { ThermalService } from '@data/services/thermal.service';

import { InformeInterface } from '@core/models/informe';
import { ThermalLayerInterface } from '@core/models/thermalLayer';

@Component({
  selector: 'app-thermal-layer-create',
  templateUrl: './thermal-layer-create.component.html',
  styleUrls: ['./thermal-layer-create.component.css'],
})
export class ThermalLayerCreateComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private informeId: string = undefined;
  informe: InformeInterface = {};
  private subscriptions: Subscription = new Subscription();
  thermalCreated = false;

  constructor(
    private router: Router,
    private informeService: InformeService,
    private formBuilder: FormBuilder,
    private _snackBar: MatSnackBar,
    private thermalService: ThermalService
  ) {}

  ngOnInit(): void {
    // obtenemos el ID de la URL
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    // traemos el informe seleccionado
    this.subscriptions.add(
      this.informeService.getInforme(this.informeId).subscribe((informe) => (this.informe = informe))
    );

    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      rangeTempMin: [, [Validators.required]],
      rangeTempMax: [, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      const thermalLayer: ThermalLayerInterface = {
        id: this.informeId,
        informeId: this.informeId,
        plantaId: this.informe.plantaId,
        gisName: this.informeId + '_thermal',
        rangeTempMin: this.form.get('rangeTempMin').value,
        rangeTempMax: this.form.get('rangeTempMax').value,
        codificationType: 'rainbowHc',
      };

      // Crea thermalLayer en la DB
      this.thermalService.addThermalLayer(thermalLayer);

      // aviso de capa termica creada correctamente
      this.openSnackBar();

      this.thermalCreated = true;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private openSnackBar() {
    this._snackBar.open('Capa térmica creada correctamente', 'OK', { duration: 5000 });
  }
}
