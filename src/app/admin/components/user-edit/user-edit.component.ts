import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { AdminService } from '@core/services/admin.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
})
export class UserEditComponent implements OnInit {
  form: FormGroup;
  emailVerified: boolean;
  id: string;
  user: UserInterface = {};

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    // Recoge el ID del usuario de la ruta
    this.activatedRoute.params.subscribe((params: Params) => {
      this.id = params.id;
    });
    this.adminService.getAllUsers().subscribe((users) => {
      users.filter((user) => {
        if (user.uid === this.id) {
          this.user = user;
          this.form.patchValue({ email: user.email, empresa: user.empresaNombre });
        }
      });
    });
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
      this.user.role = this.form.get('role').value;
      console.log(this.user);
      // Actualiza el usuario en la DB
      this.updateUser(this.user);
    }
  }

  updateUser(user: UserInterface) {
    this.adminService
      .updateUser(user)
      .then(() => {
        console.log('Usuario actualizado correctamente');
        this.router.navigate(['./admin/users']);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
