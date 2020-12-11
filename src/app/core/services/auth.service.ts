import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { UserInterface } from '../models/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: UserInterface; // Guarda los datos de usuario registrado
  public user$: Observable<UserInterface>;

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private router: Router) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.afs.doc<UserInterface>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }

  signIn(email: string, password: string) {
    // comprueba que usuario y contraseña son correctos y permite acceder
    return this.afAuth.auth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        this.router.navigate(['clientes']);
      })
      .catch((error) => {
        window.alert(error.message);
      });
  }

  /* // Sign in with Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  // Auth logic to run auth providers
  AuthLogin(provider) {
    return this.afAuth.auth
      .signInWithPopup(provider)
      .then((result) => {
        this.ngZone.run(() => {
          this.router.navigate(['clientes']);
        });
        this.setUserData(result.user);
      })
      .catch((error) => {
        window.alert(error);
      });
  } */

  signUp(email: string, password: string) {
    return this.afAuth.auth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        this.sendVerificationMail();
        this.setUserData(result.user);
      })
      .catch((error) => {
        window.alert(error.message);
      });
  }

  sendVerificationMail() {
    return this.afAuth.auth.currentUser.sendEmailVerification().then(() => {
      this.router.navigate(['../auth/verify-email-address']);
    });
  }

  ForgotPassword(passwordResetEmail) {
    return this.afAuth.auth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Hemos enviado un email para restablecer su contraseña. Revise su correo.');
      })
      .catch((error) => {
        window.alert(error);
      });
  }

  // devuelve true si el usuario esta logeado y su email verificado
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return user !== null /* && user.emailVerified !== false */ ? true : false;
  }

  setUserData(user: UserInterface) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userData: UserInterface = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      role: 0,
    };
    return userRef.set(userData, {
      merge: true,
    });
  }

  signOut() {
    return this.afAuth.auth.signOut();
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => {
        if (user) {
          return of(true);
        } else {
          return of(false);
        }
      })
    );
  }

  canAddPlantas(user: UserInterface) {
    return user.role === 1 || user.role === 4;
  }
  userIsAdmin(user: UserInterface) {
    return user.role === 1 || user.role === 3 || user.role === 4 || user.role === 5;
  }

  comprobaciones() {
    // recibe todos los usuarios
    this.afs
      .collection('users')
      .valueChanges()
      .subscribe((user) => console.log(user));

    // recibe un usurio
    // console.log(this.afs.doc(`users/${'FCeySm9ZBEeRXg7wRbIrTvwfFvE3'}`));


    /* this.afs
      .collection('users')
      .doc('FCeySm9ZBEeRXg7wRbIrTvwfFvE3')
      .delete()
      .then((f) => console.log('Usuario eliminado con exito'))
      .catch((error) => console.log(error)); */
  }
}
