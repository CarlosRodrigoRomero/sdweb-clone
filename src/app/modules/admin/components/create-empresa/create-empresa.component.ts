import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EmpresaService } from '@data/services/empresa.service';

import { Empresa } from '@core/models/empresa';

@Component({
  selector: 'app-create-empresa',
  templateUrl: './create-empresa.component.html',
  styleUrls: ['./create-empresa.component.css'],
})
export class CreateEmpresaComponent implements OnInit {
  form: FormGroup;
  empresa: Empresa = { id: '', nombre: '', labelNombre: '' };
  empresaCreated = false;

  constructor(
    private formBuilder: FormBuilder,
    private _snackBar: MatSnackBar,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      id: [, [Validators.required]],
      nombre: [, [Validators.required]],
      labelNombre: [, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      this.empresa.id = this.form.get('id').value;
      this.empresa.nombre = this.form.get('nombre').value;
      this.empresa.labelNombre = this.form.get('labelNombre').value;

      // Crea la planta en la DB
      this.empresaService.createEmpresa(this.empresa);

      // aviso de informe creado correctamente
      this.openSnackBar();

      this.empresaCreated = true;
    }
  }

  private openSnackBar() {
    this._snackBar.open('Empresa creada correctamente', 'OK', { duration: 5000 });
  }
}
