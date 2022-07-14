import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TipoSeguidor } from '@core/models/tipoSeguidor';

@Injectable({
  providedIn: 'root',
})
export class TipoSeguidorService {
  constructor(private afs: AngularFirestore) {}

  addTipoSeguidor(tipoSeguidor: TipoSeguidor) {
    this.afs
      .collection<TipoSeguidor>('tiposSeguidor')
      .add(tipoSeguidor)
      .then(() => {
        console.log('Tipo de seguidor añadido');
      })
      .catch((error) => {
        console.log('Error al añadir tipoSeguidor' + error);
      });
  }

  getTipoSeguidor(id: string): Observable<TipoSeguidor> {
    return this.afs
      .collection('tiposSeguidor')
      .doc(id)
      .snapshotChanges()
      .pipe(
        map((action) => {
          if (action.payload.exists) {
            const tipoSeguidor = action.payload.data() as TipoSeguidor;
            tipoSeguidor.id = action.payload.id;
            return tipoSeguidor;
          } else {
            return null;
          }
        })
      );
  }

  updateTipoSeguidor(tipoSeguidor: TipoSeguidor) {}

  deleteTipoSeguidor(tipoSeguidor: TipoSeguidor) {}
}
