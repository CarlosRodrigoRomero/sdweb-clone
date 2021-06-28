import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';

import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-plant-create',
  templateUrl: './plant-create.component.html',
  styleUrls: ['./plant-create.component.css'],
})
export class PlantCreateComponent implements OnInit {
  form: FormGroup;
  planta: PlantaInterface;
  plantCreated = false;

  constructor(private formBuilder: FormBuilder, private plantaService: PlantaService, private _snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      nombre: [, [Validators.required]],
      alturaBajaPrimero: [false, [Validators.required]],
      autoLocReady: [false, [Validators.required]],
      filas: [, [Validators.required]],
      columnas: [, [Validators.required]],
      empresa: [, [Validators.required]],
      latitud: [, [Validators.required]],
      longitud: [, [Validators.required]],
      moduloPotencia: [, [Validators.required]],
      nombreGlobalCoords: [],
      num_modulos: [],
      potencia: [, [Validators.required]],
      tipo: [, [Validators.required]],
      vertical: [false, [Validators.required]],
      zoom: [, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    // if (this.plantaSelected && this.vueloSelected) {
    event.preventDefault();
    if (this.form.valid) {
      this.planta.nombre = this.form.get('nombre').value;

      // this.informe.fecha = this.form.get('fecha').value.unix();
      // this.informe.emisividad = this.form.get('emisividad').value;
      // this.informe.temperatura = this.form.get('temperatura').value;
      // this.informe.tempReflejada = this.form.get('tempReflejada').value;
      // this.informe.humedadRelativa = this.form.get('humedadRelativa').value;
      // this.informe.nubosidad = this.form.get('nubosidad').value;
      // this.informe.gsd = this.form.get('gsd').value;
      // this.informe.correccHoraSrt = this.form.get('correccHoraSrt').value;
      // this.informe.disponible = this.form.get('disponible').value;
      // this.informe.vientoVelocidad = this.form.get('vientoVelocidad').value;
      // this.informe.vientoDireccion = this.form.get('vientoDireccion').value;
      // this.informe.plantaId = this.plantaSelected.id;
      // this.informe.vueloId = this.vueloSelected.id;

      // Crea la planta en la DB
      // this.informeService.addInforme(this.informe);

      // aviso de informe creado correctamente
      this.openSnackBar();

      this.plantCreated = true;
    }
    // }
  }

  private openSnackBar() {
    this._snackBar.open('Planta creada correctamente', 'OK', { duration: 5000 });
  }
}
