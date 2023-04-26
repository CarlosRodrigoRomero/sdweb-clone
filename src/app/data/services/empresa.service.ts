import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AngularFirestore } from '@angular/fire/firestore';

import { Empresa } from '@core/models/empresa';

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {
  constructor(private afs: AngularFirestore) {}

  createEmpresa(empresa: Empresa) {
    return this.afs.collection('empresas').doc(empresa.id).set(empresa);
  }

  getEmpresas(): Observable<Empresa[]> {
    return this.afs
      .collection('empresas')
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data = a.payload.doc.data() as Empresa;
            const id = a.payload.doc.id;
            return { id, ...data };
          });
        })
      );
  }
}
