import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from 'firebase';

import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { UserService } from './user.service';

import { UserInterface } from '@core/models/user';
import { HttpClient } from '@angular/common/http';

import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: UserInterface = {}; // Guarda los datos de usuario registrado
  user$: Observable<UserInterface>;

  constructor(private afAuth: AngularFireAuth, 
    private afs: AngularFirestore, 
    private userService: UserService, 
    private http: HttpClient
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

  async signIn(email: string, password: string = "password") {
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

  signUp(email: string, password: string = "password") {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  createUser(email: string, password: string = "password"): Observable<any> {
    const functionsUrl = `${environment.firebaseFunctionsUrl}/createUser`;
    const payload = { email, password };
  
    return this.http.post(functionsUrl, payload);
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
