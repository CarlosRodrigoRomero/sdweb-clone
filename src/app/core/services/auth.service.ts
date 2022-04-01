import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { User } from 'firebase';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { UserService } from './user.service';

import { UserInterface } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: UserInterface = {}; // Guarda los datos de usuario registrado
  user$: Observable<UserInterface>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private userService: UserService
  ) {
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

  async signIn(email: string, password: string) {
    try {
      const firebaseUser = await this.afAuth.signInWithEmailAndPassword(email, password);

      return this.userService.getUser(firebaseUser.user.uid);

      // return this.user;
    } catch (error) {
      return error;
    }
  }

  forgotPassword(passwordResetEmail: string) {
    return this.afAuth.sendPasswordResetEmail(passwordResetEmail);
  }

  signUp(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  signOut() {
    return this.afAuth.signOut();
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

  private getUser(firebaseUser: User) {
    const user = this.afs.doc<UserInterface>(`users/${firebaseUser.uid}`);

    return user;
  }
}
