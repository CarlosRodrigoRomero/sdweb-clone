import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { InformeInterface } from '../models/informe';
import { map, take, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { GLOBAL } from './global';
import { EstructuraInterface } from '../models/estructura';
import { ArchivoVueloInterface } from '../models/archivoVuelo';
import { PcInterface } from '../models/pc';

@Injectable({
  providedIn: 'root',
})
export class InformeService {
  private informesCollection: AngularFirestoreCollection<InformeInterface>;
  private informeDoc: AngularFirestoreDocument<InformeInterface>;
  private informe: InformeInterface;
  public informes$: Observable<InformeInterface[]>;
  public informe$: Observable<InformeInterface>;
  public url: string;
  private elementoPlantaSource = new Subject<PcInterface | EstructuraInterface>();
  selectedElementoPlanta$ = this.elementoPlantaSource.asObservable();
  private archivoVueloSource = new Subject<ArchivoVueloInterface>();
  selectedArchivoVuelo$ = this.archivoVueloSource.asObservable();
  avisadorNuevoElementoSource = new Subject<PcInterface | EstructuraInterface>();
  avisadorNuevoElemento$ = this.avisadorNuevoElementoSource.asObservable();

  constructor(public afs: AngularFirestore, private http: HttpClient) {
    this.url = GLOBAL.url;
    // this.informes = afs.collection('informes').valueChanges();
    this.informesCollection = afs.collection<InformeInterface>('informes');
    this.informes$ = this.informesCollection.valueChanges();
  }

  selectElementoPlanta(elementoPlanta: PcInterface | EstructuraInterface) {
    this.elementoPlantaSource.next(elementoPlanta);
  }
  selectArchivoVuelo(archivoVuelo: ArchivoVueloInterface) {
    this.archivoVueloSource.next(archivoVuelo);
  }

  getInformes() {
    return this.informesCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as InformeInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }
  getInformesDePlanta(plantaId: string): Observable<InformeInterface[]> {
    const query$ = this.afs.collection<InformeInterface>('informes', (ref) => ref.where('plantaId', '==', plantaId));
    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as InformeInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getInforme(id: string) {
    this.informeDoc = this.afs.doc<InformeInterface>('informes/' + id);

    return (this.informe$ = this.informeDoc.snapshotChanges().pipe(
      map((action) => {
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
      'Content-Type': 'application/json',
    });

    return this.http.get(this.url + '/informe-file-list2/' + encodeURIComponent(carpeta), { headers: header });
  }

  getImageUrl(carpeta: string, currentFlight: string, fileName: string) {
    const response = this.url + '/get-image2/' + encodeURIComponent(carpeta) + '/' + currentFlight + '/' + fileName;

    return response;
  }

  addEstructuraInforme(informeId: string, estructura: EstructuraInterface) {
    // Primero vemos que no haya ninguna otra estructura en el archivo
    this.deleteEstructuraInforme(informeId, estructura.archivo)
      .pipe(take(1))
      .subscribe((res) => {
        if (res) {
          const id = this.afs.createId();
          estructura.id = id;
          this.afs
            .collection('informes')
            .doc(informeId)
            .collection('estructuras')
            .doc(id)
            .set(estructura)
            .then((v) => {
              this.avisadorNuevoElementoSource.next(estructura);
            });
        }
      });
  }

  updateEstructura(informeId: string, estructura: EstructuraInterface) {
    const estructuraDoc = this.afs.doc('informes/' + informeId + '/estructuras/' + estructura.id);
    estructuraDoc.update(estructura);
  }

  deleteEstructuraInforme(informeId: string, currentFileName: string): Observable<boolean> {
    const response = new Subject<boolean>();

    this.afs
      .collection('informes')
      .doc(informeId)
      .collection('estructuras')
      .ref.where('archivo', '==', currentFileName)
      .get()
      .then((query) => {
        query.forEach((est) => {
          est.ref.delete();
        });
        response.next(true);
      });

    return response;
  }

  getEstructuraInforme(informeId: string, currentFileName: string): Observable<EstructuraInterface[]> {
    const query$ = this.afs
      .collection('informes')
      .doc(informeId)
      .collection('estructuras', (ref) => ref.where('archivo', '==', currentFileName));

    const result = query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as EstructuraInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );

    return result;
  }

  getAllEstructuras(informeId: string): Observable<EstructuraInterface[]> {
    const query$ = this.afs.collection('informes').doc(informeId).collection('estructuras');

    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as EstructuraInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  updateInforme(informe: InformeInterface) {
    const informeDoc = this.afs.doc('informes/' + informe.id);
    informeDoc.update(informe);
    console.log('updated');
  }

  addInforme() {}
  editInforme() {}
  set(informe: InformeInterface) {
    this.informe = informe;
  }
  get() {
    return this.informe;
  }
}
