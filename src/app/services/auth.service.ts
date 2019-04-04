import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { auth } from 'firebase/app';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { UserInterface } from '../models/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user$: Observable<firebase.User>;

  constructor(
    private afAuth: AngularFireAuth,
    // private afs: AngularFirestore,
    // private router: Router
    ) {
      this.user$ = afAuth.authState;
    }


  login(email, password): Observable<any> {
    return from(this.afAuth.auth.signInWithEmailAndPassword(email, password));
  }
  logout() {
    this.afAuth.auth.signOut();
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(
      switchMap(user => {
        if (user) {
          return of(true);
        } else {
          return of(false);
        }
      })
    );
    }

}
