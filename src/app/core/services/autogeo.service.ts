import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Coordinate } from 'ol/coordinate';

export interface Mesa {
  id?: string;
  coords: Coordinate[];
}

@Injectable({
  providedIn: 'root',
})
export class AutogeoService {
  constructor(private afs: AngularFirestore) {}

  addMesa(informeId: string, mesa: Mesa) {
    // obtenemos un ID aleatorio
    const id = this.afs.createId();

    this.afs
      .collection<Mesa>('autogeo/' + informeId + '/mesas')
      .doc(id)
      .set(mesa)
      .then(() => {
        console.log('Mesa creada correctamente con ID: ', id);
      })
      .catch((error) => {
        console.error('Error al crear mesa: ', error);
      });
  }

  updateMesa(informeId: string, mesa: Mesa) {
    const colRef = this.afs.collection('autogeo/' + informeId + '/mesas');

    colRef
      .doc(mesa.id)
      .update(mesa)
      .then(() => {
        console.log('Mesa actualizada correctamente');
      })
      .catch((error) => {
        console.error('Error al actualizar mesa: ', error);
      });
  }

  getMesas(informeId: string): Observable<Mesa[]> {
    const query$ = this.afs
      .collection<Mesa>('autogeo/' + informeId + '/mesas')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();
            data.id = doc.payload.doc.id;

            // Convertimos el objeto en un array
            data.coords = this.coordsDbToArray(data.coords);

            return data;
          })
        )
      );
    return query$;
  }

  deleteMesa(informeId: string, id: string) {
    const colRef = this.afs.collection('autogeo/' + informeId + '/mesas');

    colRef
      .doc(id)
      .delete()
      .then(() => {
        console.log('Mesa eliminada correctamente');
      })
      .catch((error) => {
        console.error('Error al eliminar mesa: ', error);
      });
  }

  private coordsDbToArray(coords: any): Coordinate[] {
    const topLeft = [coords.topLeft.long, coords.topLeft.lat] as Coordinate;
    const topRight = [coords.topRight.long, coords.topRight.lat] as Coordinate;
    const bottomRight = [coords.bottomRight.long, coords.bottomRight.lat] as Coordinate;
    const bottomLeft = [coords.bottomLeft.long, coords.bottomLeft.lat] as Coordinate;

    return [topLeft, topRight, bottomRight, bottomLeft];
  }
}
