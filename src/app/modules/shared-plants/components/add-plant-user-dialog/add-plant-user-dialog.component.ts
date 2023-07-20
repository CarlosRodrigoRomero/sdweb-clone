import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserInterface } from '@core/models/user';
import { UserService } from '@data/services/user.service';
import { ReportControlService } from '@data/services/report-control.service';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from '@data/services/auth.service';
import { Observable } from 'rxjs';
import { AngularFireFunctions } from '@angular/fire/functions';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { PlantaService } from '@data/services/planta.service';
import { MatSnackBar } from '@angular/material/snack-bar';



@Component({
  selector: 'app-add-plant-user-dialog',
  templateUrl: './add-plant-user-dialog.component.html',
  styleUrls: ['./add-plant-user-dialog.component.css']
})
export class AddPlantUserDialogComponent implements OnInit {

  form: FormGroup;
  user: UserInterface = {};
  userId: string;
  email: string;
  randomPassword: string;
  statusMessage: string;
  nombrePlantaActual: string;
  canAddUsers: boolean;
  loggedUser: UserInterface;

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private reportControlService: ReportControlService,
    private authService: AuthService,
    private functions: AngularFireFunctions,
    private http: HttpClient,
    private plantaService: PlantaService,
    private _snackBar: MatSnackBar

  ) { }

  ngOnInit(): void {

    this.buildForm();
    this.cargarNombreDeLaPlanta(this.reportControlService.plantaId);
  }

  cargarNombreDeLaPlanta(plantaId: string): void {
    this.plantaService.getPlantaNombreById(plantaId).subscribe(
      nombre => {
        this.nombrePlantaActual = nombre;
        // console.log('Nombre de la planta:', this.nombrePlantaActual); 
      },
      error => {
        console.error('Error al cargar el nombre de la planta:', error);
      }
    );
  }




  private buildForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(event: Event) {

    event.preventDefault();
    if (this.form.valid) {

      this.user.email = this.form.get('email').value;

      this.randomPassword = generateRandomPassword(10);

      this.userService.userExists(this.user.email).pipe(take(1)).subscribe(users => {
        if (users.length > 0) {
          // console.log('Usuario encontrado:', users[0]);
          this.user = users[0];

          if (this.user.role == 2) {
            this.checkIfUserContainsPlant(this.user.uid, this.reportControlService.plantaId).subscribe(contains => {
              if (contains) {
                // console.log("El usuario ya tiene la planta");
                this.openSnackBar("No se puede asignar. El usuario ya tiene asignada la planta")
              } else {
                // console.log("El usuario no tiene la planta");

                this.sendAddedPlantEmail(this.user.email, this.nombrePlantaActual);
                this.addPlantToUser(this.user.uid, this.reportControlService.plantaId);
                this.openSnackBar("Usuario encontrado. Planta asignada al usuario")
              }
            });
          } else {
            this.openSnackBar("La planta no puede asignarse al usuario porque no es un usuario externo");
          }



        } else {
          // console.log('Usuario no encontrado, creando usuario');
          this.createUser(this.user).then(uid => {
            this.sendWelcomeAddedPlantEmail(this.user.email, this.nombrePlantaActual);
            this.addPlantToUser(uid, this.reportControlService.plantaId);
            this.openSnackBar("Usuario creado y planta asignada al usuario")
          });
        }
      });
    }
    else {
      // console.log("formulario invalido");
      // Iterar sobre los controles del formulario y mostrar los errores específicos
      Object.keys(this.form.controls).forEach(field => {
        const control = this.form.get(field);
        if (control && control.invalid) {
          console.log("Errores en el campo", field, control.errors);
          this.openSnackBar(`Error en el campo ${field}`);

        }
      });
    }

  }

  checkIfUserContainsPlant(uid: string, plantaId: string): Observable<boolean> {
    return this.userService.checkIfUserContainsPlant(uid, plantaId);
  }


  async addPlantToUser(idUser: string, idPlanta: string) {
    this.userService.addPlantToUser(idUser, idPlanta)
      .then(() => {
        // console.log('Planta añadida con éxito');
      })
      .catch(error => {
        console.error('Error añadiendo la planta: ', error);
      });
  }

  createUser(user: UserInterface): Promise<string> {
    return new Promise((resolve, reject) => {
      this.authService.createUser(user.email, this.randomPassword).subscribe(result => {
        // console.log("UID New user from user create component: ", result);
        this.user.uid = result.uid;
        let userUid = result.uid;
        this.user.role = 2;
        this.userService.createUser(this.user);
        // console.log("UserUid: " + userUid)
        resolve(userUid);
      }, error => {
        console.error(error);
        reject(error);
      });
    });
  }


  cloudFunctionUrl = `${environment.firebaseFunctionsUrl}/sendEmail`;

  sendAddedPlantEmail(email: string, nombrePlanta: string) {
    const payload = {
      email,
      template: 'addedPlant',
      customParameters: { nombrePlanta }
    };

    this.http
      .post(this.cloudFunctionUrl, payload)
      .subscribe(
        () => {
          this.statusMessage = 'Correo de bienvenida enviado.';
        },
        (error) => {
          this.statusMessage = 'Error al enviar correo de bienvenida.';
          console.error(error);
        }
      );
  }


  sendResetPasswordEmail(email: string) {
    const payload = { email, template: 'resetPassword' };

    this.http
      .post(this.cloudFunctionUrl, payload)
      .subscribe(
        () => {
          this.statusMessage = 'Correo de restablecimiento enviado.';
        },
        (error) => {
          this.statusMessage = 'Error al enviar correo de restablecimiento.';
          console.error(error);
        }
      );
  }

  sendWelcomeAddedPlantEmail(email: string, nombrePlanta: string) {
    const payload = {
      email,
      template: 'welcomeAddedPlant',
      customParameters: { nombrePlanta }
    };

    this.http
      .post(this.cloudFunctionUrl, payload)
      .subscribe(
        () => {
          this.statusMessage = 'Correo de bienvenida enviado.';
        },
        (error) => {
          this.statusMessage = 'Error al enviar correo de bienvenida.';
          console.error(error);
        }
      );
  }

  private openSnackBar(message: string) {
    this._snackBar.open(message, 'OK', { duration: 5000 });
  }

}

function generateRandomPassword(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}


