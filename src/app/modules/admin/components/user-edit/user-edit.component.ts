import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';

import { Subscription } from 'rxjs';

import { UserService } from '@data/services/user.service';

import { UserInterface } from '@core/models/user';
import { EmpresaService } from '@data/services/empresa.service';
import { take } from 'rxjs/operators';
import { Empresa } from '@core/models/empresa';

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
  selectedRole: number;
  empresas: Empresa[];
  empresaSelected: Empresa;
  statusMessage: string;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private empresaService: EmpresaService
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
            this.selectedRole = user.role;
            this.form.patchValue({ email: user.email, empresa: user.empresaNombre });

            //Una vez cargado el usuario se setea la empresa de ese usuario a empresaSelected para poder asignar en el submit el id
            //de la empresa al campo empresaId del usuario

            this.empresaService
              .getEmpresas()
              .pipe(take(1))
              .subscribe((empresas) => {
                this.empresas = empresas;
                this.empresaSelected = this.empresas.find((empresa) => empresa.nombre === this.user.empresaNombre);
              });
          }
        });
      })
    );
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required]],
      empresa: [''],
      role: ['', Validators.required],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      if (this.selectedRole !== 2) {
        this.user.email = this.form.get('email').value;
        this.user.empresaNombre = this.form.get('empresa').value;
        this.user.role = Number(this.form.get('role').value);

        this.empresaSelected = this.empresas.find((empresa) => empresa.nombre === this.user.empresaNombre);
        this.user.empresaId = this.empresaSelected.id;
      } else {
        this.user.email = this.form.get('email').value;
        this.user.role = Number(this.form.get('role').value);
      }

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

  onRoleChange(event: MatSelectChange) {
    this.selectedRole = Number(event.value);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
