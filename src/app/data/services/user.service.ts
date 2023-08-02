import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

import { map } from 'rxjs/operators';

import { AngularFireFunctions } from '@angular/fire/functions';


import { AngularFirestore } from '@angular/fire/firestore';

import { UserInterface } from '@core/models/user';
import { Observable } from 'rxjs';

import { arrayRemove } from '@firebase/firestore';
import { firestore } from 'firebase/app';




@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth, private functions: AngularFireFunctions) { }



  createUser(user: UserInterface) {
    return this.afs.collection('users').doc(user.uid).set(user);
  }


  addToUsers(user: UserInterface) {
    return this.afs.collection('users').doc(user.uid).set(user);
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



  getUsersByRole(role: number): Observable<UserInterface[]> {
    return this.afs.collection('users', ref => ref.where('role', '==', role)).valueChanges();
  }


  getUsersByRoleAndPlanta(role: number, planta: string): Observable<UserInterface[]> {
    return this.afs.collection('users', ref => ref
      .where('role', '==', role)
      .where('plantas', 'array-contains', planta))
      .valueChanges();
  }


  removePlantaFromUser(userId: string, plantaId: string): Promise<void> {
    return this.afs.collection('users').doc(userId).update({
      plantas: firestore.FieldValue.arrayRemove(plantaId)
    });
  }

  addPlantToUser(userId: string, plantaId: string): Promise<void> {
    return this.afs.collection('users').doc(userId).update({
      plantas: firestore.FieldValue.arrayUnion(plantaId)
    });
  }


  getUserIdByEmail(email: string) {
    return this.afs
      .collection('users', (ref) => ref.where('email', '==', email))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => a.payload.doc.id)
        )
      );
  }

  userExists(email: string) {
    return this.afs.collection('users', ref => ref.where('email', '==', email))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data: any = a.payload.doc.data();
          const id = a.payload.doc.id;
          return { id, ...data };
        }))
      );
  }

  checkIfUserContainsPlant(userId: string, plantId: string) {
    // Obtener el documento del usuario por userId
    return this.afs.collection('users').doc(userId).get().pipe(
      map(doc => {
        if (doc.exists) {
          // Obtener el array de plantas del usuario
          const user = doc.data() as UserInterface;
          const plantas = user ? user.plantas : [];

          if (plantas == undefined) {
            console.log("El usuario no tiene ninguna planta todavía");
            return false;
          }

          // Verificar si el array contiene el plantId
          return plantas.includes(plantId);
        } else {
          console.log('Documento no encontrado');
          return false;
        }
      })
    );
  }
}
