import { Injectable } from '@angular/core';

import { map } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { UserInterface } from '@core/models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private afs: AngularFirestore) {}

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
}
