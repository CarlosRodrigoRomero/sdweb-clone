import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { Observable, from, of } from "rxjs";
import { switchMap } from "rxjs/operators";
import { AngularFirestore } from "@angular/fire/firestore";
import { UserInterface } from "../models/user";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  public user$: Observable<firebase.User>;

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.afs
            .doc<UserInterface>(`users/${user.uid}`)
            .valueChanges();
        } else {
          return of(null);
        }
      })
    );
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
