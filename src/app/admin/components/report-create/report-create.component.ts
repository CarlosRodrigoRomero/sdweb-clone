import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { InformeService } from '@core/services/informe.service';

import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-report-create',
  templateUrl: './report-create.component.html',
  styleUrls: ['./report-create.component.css'],
})
export class ReportCreateComponent implements OnInit {
  form: FormGroup;
  informe: InformeInterface;

  constructor(private formBuilder: FormBuilder, private router: Router, private informeService: InformeService) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      emisividad: [0.85, [Validators.required, Validators.min(0), Validators.max(1)]],
      tempReflejada: [-30, [Validators.required]],
      humedadRelativa: [, [Validators.required, Validators.min(0), Validators.max(1)]],
      nubosidad: [, [Validators.required, Validators.min(1), Validators.max(8)]],
      gsd: [3, [Validators.required]],
      correccHoraSrt: [8, [Validators.required]],
      disponible: [false, [Validators.required]],
      vientoVelocidad: [, [Validators.required]],
      vientoDireccion: [, [Validators.required, Validators.min(0), Validators.max(360)]],
      temperatura: [, [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      // this.user.uid = this.form.get('uid').value;
      // this.user.email = this.form.get('email').value;
      // this.user.empresaNombre = this.form.get('empresa').value;
      // this.user.role = this.form.get('role').value as number;

      // Crea el usuario en la DB
      this.informeService.addInforme(this.informe);
    }
  }
}
