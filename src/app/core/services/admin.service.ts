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
    return this.firestore.collection('users').add(user);
  }

  updateUser(user: UserInterface) {
    return this.firestore.collection('users').doc(user.uid).update(user);
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

  sendVerificationMail() {
    return this.afAuth.auth.currentUser.sendEmailVerification().then(() => {
      this.router.navigate(['../auth/verify-email-address']);
    });
  }
}
