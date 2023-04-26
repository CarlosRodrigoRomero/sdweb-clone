import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { switchMap, take } from 'rxjs/operators';

import { EmpresaService } from '@data/services/empresa.service';
import { PlantaService } from '@data/services/planta.service';

import { Empresa } from '@core/models/empresa';

@Component({
  selector: 'app-empresa-edit',
  templateUrl: './empresa-edit.component.html',
  styleUrls: ['./empresa-edit.component.css'],
})
export class EmpresaEditComponent implements OnInit {
  form: FormGroup;
  private empresaId: string;
  private empresa: Empresa;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private plantaService: PlantaService,
    private empresaService: EmpresaService,
    private _snackBar: MatSnackBar
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    // obtenemos el ID de la URL
    this.empresaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    // traemos la empresa a editar
    this.empresaService
      .getEmpresa(this.empresaId)
      .pipe(take(1))
      .subscribe((empresa) => {
        this.empresa = empresa;

        this.form.patchValue(this.empresa);
      });
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      nombre: [, [Validators.required]],
      labelNombre: [, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.form.get('nombre').value !== null) {
      this.empresa.nombre = this.form.get('nombre').value;
    }

    if (this.form.get('labelNombre').value !== null) {
      this.empresa.labelNombre = this.form.get('labelNombre').value;
    }

    // Actualizamos la empresa en la DB
    this.empresaService.updateEmpresa(this.empresa).then(() => {
      // aviso de informe creado correctamente
      this.openSnackBar();
    });
  }

  private openSnackBar() {
    this._snackBar.open('Empresa actualizada correctamente', 'OK', { duration: 5000 });
  }
}
