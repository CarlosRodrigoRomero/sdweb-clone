import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Comentario } from '@core/models/comentario';
import { InformeInterface } from '@core/models/informe';

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

  getComentariosInformes(informes: InformeInterface[]): Observable<Comentario[]> {
    const comentObsList = Array<Observable<Comentario[]>>();
    informes.forEach((informe) => {
      comentObsList.push(this.getComentariosInforme(informe.id));
    });

    return combineLatest(comentObsList).pipe(map((arr) => arr.flat()));
  }

  deleteComentario(comentarioId: string) {
    const ref = this.afs.collection('comentarios/');

    ref
      .doc(comentarioId)
      .delete()
      .then(() => {
        console.log('Comentario eliminado correctamente con ID: ', comentarioId);
      })
      .catch((error) => {
        console.error('Error al eliminar comentario: ', error);
      });
  }
}
