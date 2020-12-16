import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument, docChanges } from '@angular/fire/firestore';

import { UserInterface } from '@core/models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore, private router: Router) {}

  createUser(user: UserInterface) {
    this.firestore
      .collection('users')
      .add(user)
      .then(() => {
        console.log('Usuario creado correctamente');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  updateUser(user: UserInterface) {
    this.firestore
      .collection('users')
      .doc(user.uid)
      .update(user)
      .then(() => {
        console.log('Usuario actualizado correctamente');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  getUser(id: string): any {
    return this.firestore.doc<UserInterface>(`users/${id}`);
  }

  getAllUsers(): Observable<UserInterface[]> {
    return this.firestore.collection('users').valueChanges();
  }

  deleteUser(user: UserInterface) {
    this.firestore
      .collection('users')
      .doc(user.uid)
      .delete()
      .then(() => {
        console.log('Usuario eliminado correctamente');
      })
      .catch((err) => {
        console.log(err);
      });
  }

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

  setUserData(user: UserInterface) {
    const userRef: AngularFirestoreDocument<any> = this.firestore.doc(`users/${user.uid}`);
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
}
