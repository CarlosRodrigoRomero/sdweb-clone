import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';

import { UserInterface } from '@core/models/user';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private router: Router) {}

  createUser(user: UserInterface) {
    return this.afs.collection('users').add(user);
  }

  updateUser(user: UserInterface) {
    return this.afs.collection('users').doc(user.uid).update(user);
  }

  getUser(id: string): Observable<UserInterface> {
    const userRef = this.afs.collection<UserInterface>('users').doc(id);

    return userRef.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists) {
          const data = action.payload.data() as UserInterface;
          data.uid = action.payload.id;
          return data;
        } else {
          return null;
        }
      })
    );
  }

  getAllUsers(): Observable<UserInterface[]> {
    return this.afs.collection('users').valueChanges();
  }

  deleteUser(user: UserInterface) {
    this.afs
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

  async sendVerificationMail() {
    return (await this.afAuth.currentUser).sendEmailVerification().then(() => {
      this.router.navigate(['../auth/verify-email-address']);
    });
  }
}
