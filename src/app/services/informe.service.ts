import { Injectable } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { InformeInterface } from "../models/informe";
import { map, take } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { HttpHeaders } from "@angular/common/http";
import { GLOBAL } from "./global";
import { Estructura } from "../models/estructura";

@Injectable({
  providedIn: "root"
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
    this.informesCollection = afs.collection<InformeInterface>("informes");
    this.informes = this.informesCollection.valueChanges();
  }

  getInformes() {
    return this.informesCollection.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as InformeInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }
  getInformesDeEmpresa(uid: string) {
    const query$ = this.afs.collection<InformeInterface>("informes", ref =>
      ref.where("empresa", "==", uid)
    );
    return query$.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as InformeInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getInforme(id: string) {
    this.informeDoc = this.afs.doc<InformeInterface>("informes/" + id);

    return (this.informe = this.informeDoc.snapshotChanges().pipe(
      map(action => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as InformeInterface;
          data.id = action.payload.id;
          return data;
        }
      })
    ));
  }

  getFileList(carpeta: string): Observable<any> {
    const header = new HttpHeaders({
      "Content-Type": "application/json"
    });

    return this.http.get(
      this.url + "/informe-file-list2/" + encodeURIComponent(carpeta),
      { headers: header }
    );
  }

  // getImage(carpeta: string, fileName: string): Observable<any> {
  //   const header = new HttpHeaders({
  //     'Content-Type' : 'application/json'
  //   });

  //   return this.http.get(this.url + '/get-image2/' + encodeURIComponent(carpeta) + '/' + fileName, {headers: header});
  // }

  getImageUrl(carpeta: string, currentFlight: string, fileName: string) {
    const response =
      this.url +
      "/get-image2/" +
      encodeURIComponent(carpeta) +
      "/" +
      currentFlight +
      "/" +
      fileName;

    return response;
  }

  addEstructuraInforme(informeId: string, estructura: Estructura) {
    const id = this.afs.createId();
    estructura.id = id;
    this.afs
      .collection("informes")
      .doc(informeId)
      .collection("estructuras")
      .doc(id)
      .set(estructura);
  }

  deleteEstructuraInforme(informeId: string, currentFileName: string) {
    this.afs
      .collection("informes")
      .doc(informeId)
      .collection("estructuras")
      .ref.where("filename", "==", currentFileName)
      .get()
      .then(query => {
        query.forEach(est => {
          est.ref.delete();
        });
      });
  }

  getEstructuraInforme(
    informeId: string,
    currentFileName: string
  ): Observable<Estructura[]> {
    const query$ = this.afs
      .collection("informes")
      .doc(informeId)
      .collection("estructuras", ref =>
        ref.where("filename", "==", currentFileName)
      );

    const result = query$.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as Estructura;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );

    return result;
  }
  updateInforme(informe: InformeInterface) {
    const informeDoc = this.afs.doc("informes/" + informe.id);
    informeDoc.update(informe);
  }

  addInforme() {}
  editInforme() {}
}
