import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { InformeInterface } from '../models/informe';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {HttpHeaders} from '@angular/common/http';
import { GLOBAL } from './global';


@Injectable({
  providedIn: 'root'
})
export class InformeService {
  private informesCollection: AngularFirestoreCollection<InformeInterface>;
  private informes: Observable<InformeInterface[]>;
  private informeDoc: AngularFirestoreDocument<InformeInterface>;
  private informe: Observable<InformeInterface>;
  public url: string;

  constructor(public afs: AngularFirestore, private http: HttpClient) {
    this.url = GLOBAL.url;
    // this.informes = afs.collection('informes').valueChanges();
    this.informesCollection = afs.collection<InformeInterface>('informes');
    this.informes = this.informesCollection.valueChanges();
  }


  getInformes() {
    return this.informesCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
    const data = a.payload.doc.data() as InformeInterface;
    data.id = a.payload.doc.id;
    return data;
  }))
);
  }

  getInforme(id: string) {
    this.informeDoc = this.afs.doc<InformeInterface>('informes/' + id);

    return this.informe = this.informeDoc.snapshotChanges().pipe(map(action => {
      if (action.payload.exists === false) {
        return null;
      } else {
        const data = action.payload.data() as InformeInterface;
        data.id = action.payload.id;
        return data;
      }
    }));
  }

    getFileList(carpeta: string): Observable<any> {
      const header = new HttpHeaders({
        'Content-Type' : 'application/json'
      });

      return this.http.get(this.url + '/informe-file-list2/' + encodeURIComponent(carpeta), {headers: header});
    }

    // getImage(carpeta: string, fileName: string): Observable<any> {
    //   const header = new HttpHeaders({
    //     'Content-Type' : 'application/json'
    //   });

    //   return this.http.get(this.url + '/get-image2/' + encodeURIComponent(carpeta) + '/' + fileName, {headers: header});
    // }

    getImageUrl(carpeta: string, currentFlight: string, fileName: string) {
      const response = this.url + '/get-image2/' + encodeURIComponent(carpeta) + '/' + currentFlight + '/' + fileName;

      return response;
    }

    addInforme() {

    }
    editInforme() {
    }

  }

