import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminService } from '@core/services/admin.service';
import { AuthService } from '@core/services/auth.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css'],
})
export class CreateUserComponent implements OnInit {
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
      email: ['', [Validators.required]],
      empresa: ['', [Validators.required]],
      role: ['', Validators.required],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      this.user.email = this.form.get('email').value;
      this.user.empresaNombre = this.form.get('empresa').value;
      this.user.role = this.form.get('role').value as number;
      console.log(this.user);
      // Crea el usuario en la DB
      this.signUp().then(() => console.log(this.user));
      // this.createUser(this.user);
      // this.crear();
    }
  }

  signUp() {
    return this.authService
      .signUp(this.user.email, 'password')
      .then((userAuth) => {
        this.user.uid = userAuth.user.uid;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  createUser(user: UserInterface) {
    return this.adminService
      .createUser(user)
      .then(() => {
        console.log('Usuario creado correctamente');
        this.router.navigate(['./admin/users']);
      })
      .catch((err) => {
        console.error('Error al crear documento: ', err);
      });
  }

  create(user: UserInterface) {
    return this.authService.signUp(this.user.email, 'password').then((userAuth) => {
      // user.uid = userAuth.user.uid;
      this.createUser(user);
    });
  }
}
