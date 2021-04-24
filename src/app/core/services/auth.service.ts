import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';

import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { UserInterface } from '../models/user';

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
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  forgotPassword(passwordResetEmail: string) {
    return this.afAuth.auth.sendPasswordResetEmail(passwordResetEmail);
  }

  signUp(email: string, password: string) {
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password);
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
    if (user !== undefined && user !== null) {
      return user.role === 1 || user.role === 3 || user.role === 4 || user.role === 5;
    }
  }
}
