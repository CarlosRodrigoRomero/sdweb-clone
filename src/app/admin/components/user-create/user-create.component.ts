import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminService } from '@core/services/admin.service';
import { AuthService } from '@core/services/auth.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css'],
})
export class UserCreateComponent implements OnInit {
  form: FormGroup;
  user: UserInterface = {};

  constructor(
    private formBuilder: FormBuilder,
    private adminService: AdminService,
    private router: Router,
    private authService: AuthService
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
      this.user.role = this.form.get('role').value as number;

      // Crea el usuario en la DB
      this.createUser(this.user);

      // Enviamos un email para que el usuario cambie su contraseña
      this.authService.forgotPassword(this.user.email);
    }
  }

  createUser(user: UserInterface) {
    return this.adminService
      .createUser(user)
      .then(() => {
        console.log('Usuario creado correctamente');
        this.router.navigate(['./admin/users']);
      })
      .catch((err) => {
        console.error('Error al crear usuario: ', err);
      });
  }
}
