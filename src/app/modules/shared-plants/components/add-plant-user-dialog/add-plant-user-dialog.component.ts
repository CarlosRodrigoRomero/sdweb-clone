import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserInterface } from '@core/models/user';
import { UserService } from '@data/services/user.service';
import { ReportControlService } from '@data/services/report-control.service';
import { take } from 'rxjs/operators';
import { AuthService } from '@data/services/auth.service';
import { Observable } from 'rxjs';



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


  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private reportControlService: ReportControlService,
    private authService: AuthService,


  ) { }

  ngOnInit(): void {

    this.buildForm();

  }

  private buildForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }


  // onSubmit(event: Event) {

  //   event.preventDefault();
  //   if (this.form.valid) {

  //     this.user.email = this.form.get('email').value;

  //     this.userService.getUserIdByEmail(this.user.email).pipe(take(1)).subscribe((userIds) => {
  //       if (userIds && userIds.length > 0) {
  //         this.userId = userIds[0]; // Asignando el primer ID de la lista a la variable userId

  //         // Llama a addPlantToUser dentro de la suscripción, después de asignar this.userId
  //         this.addPlantToUser(this.userId, this.reportControlService.plantaId);
  //       } else {
  //         console.log('No se encontró un usuario con el email especificado');
  //       }
  //     });

  //   }
  //   else {
  //     console.log("formulario invalido");
  //     // Iterar sobre los controles del formulario y mostrar los errores específicos
  //     Object.keys(this.form.controls).forEach(field => {
  //       const control = this.form.get(field);
  //       if (control && control.invalid) {
  //         console.log("Errores en el campo", field, control.errors);
  //       }
  //     });
  //   }

  // }


  onSubmit(event: Event) {

    event.preventDefault();
    if (this.form.valid) {

      // this.user.email = this.form.get('email').value;

      this.user.email = this.form.get('email').value;

      this.randomPassword = generateRandomPassword(10);

      this.userService.userExists(this.user.email).pipe(take(1)).subscribe(users => {
        if (users.length > 0) {
          console.log('Usuario encontrado:', users[0]);
          this.user = users[0];



          this.checkIfUserContainsPlant(this.user.uid, this.reportControlService.plantaId).subscribe(contains => {
            if (contains) {
              console.log("El usuario ya tiene la planta");
            } else {
              console.log("El usuario no tiene la planta");
              this.addPlantToUser(this.user.uid, this.reportControlService.plantaId);
            }
          });

        } else {
          console.log('Usuario no encontrado, creando usuario');
          this.createUser(this.user).then(uid => {
            // Ahora uid debería ser una cadena que representa el uid del usuario creado
            this.addPlantToUser(uid, this.reportControlService.plantaId);
          });
        }
      });



      // this.userService.getUserIdByEmail(this.user.email).pipe(take(1)).subscribe((userIds) => {
      //   if (userIds && userIds.length > 0) {
      //     this.userId = userIds[0]; // Asignando el primer ID de la lista a la variable userId

      //     // Llama a addPlantToUser dentro de la suscripción, después de asignar this.userId
      //     this.addPlantToUser(this.userId, this.reportControlService.plantaId);
      //   } else {
      //     console.log('No se encontró un usuario con el email especificado');
      //   }
      // });

    }
    else {
      console.log("formulario invalido");
      // Iterar sobre los controles del formulario y mostrar los errores específicos
      Object.keys(this.form.controls).forEach(field => {
        const control = this.form.get(field);
        if (control && control.invalid) {
          console.log("Errores en el campo", field, control.errors);
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
        console.log('Planta añadida con éxito');
      })
      .catch(error => {
        console.error('Error añadiendo la planta: ', error);
      });
  }


  // async createUser(user: UserInterface) {
  //   this.authService.createUser(user.email, this.randomPassword).subscribe(result => {
  //     console.log("UID New user from user create component: ", result);

  //     // console.table(result);
  //     this.user.uid = result.uid;

  //     let userUid = result.uid;

  //     this.userService.createUser(this.user);

  //     // this.openSnackBar();

  //     this.authService.forgotPassword(this.user.email);

  //     console.log("UserUid: " + userUid)
  //     return userUid;

  //   }, error => {
  //     console.error(error);
  //   });
  // }


  createUser(user: UserInterface): Promise<string> {
    return new Promise((resolve, reject) => {
      this.authService.createUser(user.email, this.randomPassword).subscribe(result => {
        console.log("UID New user from user create component: ", result);
        this.user.uid = result.uid;
        let userUid = result.uid;
        this.user.role = 2;
        this.userService.createUser(this.user);
        // this.authService.forgotPassword(this.user.email);
        // this.sendPasswordResetEmail(user.email);
        console.log("UserUid: " + userUid)
        resolve(userUid);
      }, error => {
        console.error(error);
        reject(error);
      });
    });
  }

  // sendPasswordResetEmail(email: string) {
  //   const sendCustomPasswordResetEmail = firebase.functions().httpsCallable('sendCustomPasswordResetEmail');
    
  //   sendCustomPasswordResetEmail({ email: email })
  //     .then((result) => {
  //       console.log(result); // Handle the response from the function here
  //     })
  //     .catch((error) => {
  //       console.error('Error invoking the Cloud Function:', error);
  //     });
  // }
}

function generateRandomPassword(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}


