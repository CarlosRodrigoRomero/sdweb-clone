import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Warning, warnings } from '@shared/components/warnings-menu/warnings';

@Injectable({
  providedIn: 'root',
})
export class WarningService {
  constructor(private afs: AngularFirestore) {}

  addWarning(informeId: string, warning: Warning) {
    // obtenemos un ID aleatorio
    const id = this.afs.createId();

    // solo guardamos algunos campos
    warning = this.getDbFields(warning);

    this.afs
      .collection<Warning>('informes/' + informeId + '/warnings')
      .doc(id)
      .set(warning)
      .then(() => {
        console.log('Alerta añadida correctamente con ID: ', id);
      })
      .catch((error) => {
        console.error('Error al añadir alerta: ', error);
      });
  }

  updateWarning(informeId: string, warning: Warning) {
    // solo guardamos algunos campos
    warning = this.getDbFields(warning);

    const colRef = this.afs.collection('informes/' + informeId + '/warnings');

    colRef
      .doc(warning.id)
      .update(warning)
      .then(() => {
        console.log('Alerta actualizada correctamente');
      })
      .catch((error) => {
        console.error('Error al actualizar alerta: ', error);
      });
  }

  getWarningByType(informeId: string, type: string): Observable<Warning[]> {
    const query$ = this.afs
      .collection<Warning>('informes/' + informeId + '/warnings', (ref) => ref.where('type', '==', type))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();
            data.id = doc.payload.doc.id;

            const warning = warnings.find((w) => w.type === data.type);

            if (warning !== undefined) {
              data.message = warning.message;
              data.adminActions = warning.adminActions;
              data.reportActions = warning.reportActions;
            }

            return data;
          })
        )
      );
    return query$;
  }

  getWarnings(informeId: string): Observable<Warning[]> {
    const query$ = this.afs
      .collection<Warning>('informes/' + informeId + '/warnings')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();
            data.id = doc.payload.doc.id;

            const warning = warnings.find((w) => w.type === data.type);

            if (warning !== undefined) {
              data.message = warning.message;
              data.adminActions = warning.adminActions;
              data.reportActions = warning.reportActions;
            }

            return data;
          })
        )
      );
    return query$;
  }

  deleteWarning(informeId: string, warningId: string) {
    const colRef = this.afs.collection('informes/' + informeId + '/warnings');

    colRef
      .doc(warningId)
      .delete()
      .then(() => {
        console.log('Alerta borrada correctamente');
      })
      .catch((error) => {
        console.error('Error al borrar alerta: ', error);
      });
  }

  private getDbFields(warning: Warning): any {
    return {
      type: warning.type,
      visible: warning.visible,
    };
  }
}
