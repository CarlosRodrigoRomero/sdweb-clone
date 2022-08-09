import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

import { Comentario } from '@core/models/comentario';

@Injectable({
  providedIn: 'root',
})
export class ComentariosService {
  constructor(private afs: AngularFirestore) {}

  addComentario(comentario: Comentario) {
    let id = comentario.id;

    if (id === undefined) {
      id = this.afs.createId();
      comentario.id = id;
    }

    const ref = this.afs.collection('comentarios/');

    ref
      .doc(id)
      .set(comentario)
      .then(() => {
        console.log('Comentario añadido correctamente con ID: ', id);
      })
      .catch((error) => {
        console.error('Error al añadir comentario: ', error);
      });
  }

  getComentariosAnomalia(anomaliaId: string): Observable<Comentario[]> {
    return this.afs
      .collection<Comentario>('comentarios', (ref) => ref.where('anomaliaId', '==', anomaliaId))
      .valueChanges();
  }

  getComentariosInforme(informeId: string): Observable<Comentario[]> {
    return this.afs
      .collection<Comentario>('comentarios', (ref) => ref.where('informeId', '==', informeId))
      .valueChanges();
  }
}
