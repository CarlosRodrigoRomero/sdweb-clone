import { Injectable } from '@angular/core';

import { map } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { UserInterface } from '@core/models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private afs: AngularFirestore) {}

  getUser(userId: string) {
    const userRef = this.afs.collection('users').doc(userId);

    return userRef.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists) {
          const data = action.payload.data() as UserInterface;
          data.uid = action.payload.id;
          return data;
        } else {
          console.log('No existe el usuario');
          return null;
        }
      })
    );
  }
}
