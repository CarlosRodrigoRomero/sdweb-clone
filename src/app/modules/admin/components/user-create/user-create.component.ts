import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';

import { AuthService } from '@data/services/auth.service';
import { UserService } from '@data/services/user.service';
import { EmpresaService } from '@data/services/empresa.service';

import { UserInterface } from '@core/models/user';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css'],
})
export class UserCreateComponent implements OnInit {
  form: FormGroup;
  user: UserInterface = {};
  selectedRole: number;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private empresaService: EmpresaService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {}

  private buildForm() {
    this.form = this.formBuilder.group({
      uid: ['', [Validators.required]],
      email: ['', [Validators.required]],
      empresa: ['', [Validators.required]],
      role: ['', Validators.required],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      this.user.uid = this.form.get('uid').value;
      this.user.email = this.form.get('email').value;
      this.user.empresaNombre = this.form.get('empresa').value;
      this.user.role = Number(this.form.get('role').value);

      // Crea el usuario en la DB
      this.createUser(this.user);

      // Crea la empresa si no existe
      this.checkIfCompanyExists(this.user);

      // Enviamos un email para que el usuario cambie su contraseña
      this.authService.forgotPassword(this.user.email);
    }
  }

  async createUser(user: UserInterface) {
    return this.userService
      .createUser(user)
      .then(() => {
        console.log('Usuario creado correctamente');
        this.router.navigate(['./admin/users']);
      })
      .catch((err) => {
        console.error('Error al crear usuario: ', err);
      });
  }

  private checkIfCompanyExists(user: UserInterface) {
    this.empresaService
      .getEmpresas()
      .pipe(take(1))
      .subscribe((empresas) => {
        const nombresEmpresas = empresas.map((empresa) => empresa.nombre);
        if (!nombresEmpresas.includes(user.empresaNombre)) {
          const empresa = {
            id: user.uid,
            nombre: user.empresaNombre,
          };

          this.empresaService.createEmpresa(empresa);
        }
      });
  }

  onRoleChange(event: MatSelectChange) {
    this.selectedRole = Number(event.value);
  }
}
