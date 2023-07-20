import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';

import { AuthService } from '@data/services/auth.service';
import { UserService } from '@data/services/user.service';
import { EmpresaService } from '@data/services/empresa.service';

import { UserInterface } from '@core/models/user';
import { take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { Empresa } from '@core/models/empresa';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css'],
})
export class UserCreateComponent implements OnInit {
  form: FormGroup;
  user: UserInterface = {};
  selectedRole: number;
  randomPassword: string;
  empresas: Empresa[];
  empresaSelected: Empresa;
  statusMessage: string;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private empresaService: EmpresaService,
    private _snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.empresaService
      .getEmpresas()
      .pipe(take(1))
      .subscribe((empresas) => (this.empresas = empresas));

    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required]],
      role: ['', Validators.required],
    });
  }

  onSubmit(event: Event) {
    if (this.empresaSelected !== undefined) {
      event.preventDefault();
      if (this.form.valid) {
        this.user.email = this.form.get('email').value;
        this.user.role = Number(this.form.get('role').value);
        this.user.empresaNombre = this.empresaSelected.nombre;
        this.user.empresaId = this.empresaSelected.id;

        this.randomPassword = generateRandomPassword(10);

        this.createUser(this.user);
      } else {
        console.log('formulario invalido');
        // Iterar sobre los controles del formulario y mostrar los errores específicos
        Object.keys(this.form.controls).forEach((field) => {
          const control = this.form.get(field);
          if (control && control.invalid) {
            console.log('Errores en el campo', field, control.errors);
          }
        });
      }
    }
  }

  async createUser(user: UserInterface) {
    this.authService.createUser(user.email, this.randomPassword).subscribe(
      (result) => {
        // console.log("UID New user from user create component: ", result);

        this.user.uid = result.uid;

        this.userService.createUser(this.user);

        this.openSnackBar();
        // console.log('Usuario creado correctamente');
        this.router.navigate(['./admin/users']);

        //Enviamos el email para resetear la contraseña
        this.sendWelcomeAndResetPasswordEmail(this.user.email);
      },
      (error) => {
        console.error(error);
      }
    );
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
            labelNombre: user.empresaNombre,
          };

          this.empresaService.createEmpresa(empresa);
        }
      });
  }

  onRoleChange(event: MatSelectChange) {
    this.selectedRole = Number(event.value);
  }

  getElemSelected(element: any) {
    this.empresaSelected = element;
  }

  private openSnackBar() {
    this._snackBar.open('Usuario creado correctamente', 'OK', { duration: 5000 });
  }

  cloudFunctionUrl = `${this.authService.firebaseFunctionsUrl}/sendEmail`;

  sendWelcomeAndResetPasswordEmail(email: string) {
    const payload = { email, template: 'welcome' };

    this.http.post(this.cloudFunctionUrl, payload).subscribe(
      () => {
        this.statusMessage = 'Correo de restablecimiento enviado.';
      },
      (error) => {
        this.statusMessage = 'Error al enviar correo de restablecimiento.';
        console.error(error);
      }
    );
  }
}

function generateRandomPassword(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}
