import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { PlantaInterface } from 'src/app/models/planta';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PlantaService {
  public itemDoc: AngularFirestoreDocument<PlantaInterface>;
  private plantas: Observable<PlantaInterface[]>;
  public planta: Observable<PlantaInterface>;
  private plantaDoc: AngularFirestoreDocument<PlantaInterface>;
  public plantasCollection: AngularFirestoreCollection<PlantaInterface>;

  constructor(private afs: AngularFirestore) {
    this.plantas = afs.collection('plantas').valueChanges();
  }

  getPlanta(id: string) {
    this.plantaDoc = this.afs.doc<PlantaInterface>('plantas/' + id);

    return this.planta = this.plantaDoc.snapshotChanges().pipe(map(action => {
      if (action.payload.exists === false) {
        return null;
      } else {
        const data = action.payload.data() as PlantaInterface;
        data.id = action.payload.id;
        return data;
      }
    }));
  }

  getPlantas() {
    return this.plantasCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
    const data = a.payload.doc.data() as PlantaInterface;
    data.id = a.payload.doc.id;
    return data;
  }))
);
  }
}
