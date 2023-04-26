import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { UserService } from '@data/services/user.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
})
export class UserEditComponent implements OnInit, OnDestroy {
  form: FormGroup;
  emailVerified: boolean;
  id: string;
  user: UserInterface = {};

  private subscriptions: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    // Recoge el ID del usuario de la ruta
    this.subscriptions.add(
      this.activatedRoute.params.subscribe((params: Params) => {
        this.id = params.id;
      })
    );

    this.subscriptions.add(
      this.userService.getAllUsers().subscribe((users) => {
        users.filter((user) => {
          if (user.uid === this.id) {
            this.user = user;
            this.form.patchValue({ email: user.email, empresa: user.empresaNombre });
          }
        });
      })
    );
  }

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
      this.user.role = Number(this.form.get('role').value);

      // Actualiza el usuario en la DB
      this.updateUser(this.user);
    }
  }

  updateUser(user: UserInterface) {
    this.userService
      .updateUser(user)
      .then(() => {
        console.log('Usuario actualizado correctamente');
        this.router.navigate(['./admin/users']);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
