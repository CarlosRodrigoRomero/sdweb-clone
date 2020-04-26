import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { InformeInterface } from '../models/informe';
import { map, take, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { GLOBAL } from './global';
import { EstructuraInterface, Estructura } from '../models/estructura';
import { ArchivoVueloInterface } from '../models/archivoVuelo';
import { ElementoPlantaInterface } from '../models/elementoPlanta';

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
  private elementoPlantaSource = new Subject<ElementoPlantaInterface>();
  selectedElementoPlanta$ = this.elementoPlantaSource.asObservable();
  private archivoVueloSource = new Subject<ArchivoVueloInterface>();
  selectedArchivoVuelo$ = this.archivoVueloSource.asObservable();
  avisadorNuevoElementoSource = new Subject<ElementoPlantaInterface>();
  avisadorNuevoElemento$ = this.avisadorNuevoElementoSource.asObservable();

  constructor(public afs: AngularFirestore, private http: HttpClient) {
    this.url = GLOBAL.url;
    // this.informes = afs.collection('informes').valueChanges();
    this.informesCollection = afs.collection<InformeInterface>('informes');
    this.informes$ = this.informesCollection.valueChanges();
  }

  selectElementoPlanta(elementoPlanta: ElementoPlantaInterface) {
    this.elementoPlantaSource.next(elementoPlanta);
    this.selectArchivoVuelo({ archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface);
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

  addEstructuraInforme(informeId: string, estructura: Estructura) {
    const estructuraObj = Object.assign({}, estructura);
    // Primero vemos que no haya ninguna otra estructura en el archivo
    this.deleteEstructuraInforme(informeId, estructura.archivo)
      .pipe(take(1))
      .subscribe((res) => {
        if (res) {
          const id = this.afs.createId();
          estructura.id = id;
          estructuraObj.id = id;
          this.afs
            .collection('informes')
            .doc(informeId)
            .collection('estructuras')
            .doc(id)
            .set(estructuraObj)
            .then((v) => {
              this.avisadorNuevoElementoSource.next(estructura);
              this.selectElementoPlanta(estructura);
            });
        }
      });
  }

  updateElementoPlanta(informeId: string, elementoPlanta: ElementoPlantaInterface): void {
    if (elementoPlanta.constructor.name === Estructura.name) {
      this.updateEstructura(informeId, elementoPlanta as Estructura);
    }
  }

  updateEstructura(informeId: string, estructura: EstructuraInterface) {
    const estructuraObj = Object.assign({}, estructura);
    const estructuraDoc = this.afs.doc('informes/' + informeId + '/estructuras/' + estructura.id);
    estructuraDoc.update(estructuraObj);
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

  getEstructuraInforme(informeId: string, currentFileName: string): Observable<Estructura[]> {
    const query$ = this.afs
      .collection('informes')
      .doc(informeId)
      .collection('estructuras', (ref) => ref.where('archivo', '==', currentFileName));

    const result = query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as EstructuraInterface;
          data.id = a.payload.doc.id;
          return new Estructura(data);
        })
      )
    );

    return result;
  }

  getAllEstructuras(informeId: string): Observable<Estructura[]> {
    const query$ = this.afs.collection('informes').doc(informeId).collection('estructuras');

    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as EstructuraInterface;
          data.id = a.payload.doc.id;
          return new Estructura(data);
        })
      )
    );
  }

  updateInforme(informe: InformeInterface) {
    const informeDoc = this.afs.doc('informes/' + informe.id);
    informeDoc.update(informe);
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
