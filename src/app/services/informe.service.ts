import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable, Subject } from 'rxjs';
import { InformeInterface } from '../models/informe';
import { map, take } from 'rxjs/operators';
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
  public selectedElementoPlanta: ElementoPlantaInterface;
  public selectedArchivoVuelo: ArchivoVueloInterface;
  private elementoPlantaSource = new Subject<ElementoPlantaInterface>();
  selectedElementoPlanta$ = this.elementoPlantaSource.asObservable();
  private archivoVueloSource = new Subject<ArchivoVueloInterface>();
  selectedArchivoVuelo$ = this.archivoVueloSource.asObservable();

  avisadorNuevoElementoSource = new Subject<ElementoPlantaInterface>();
  avisadorNuevoElemento$ = this.avisadorNuevoElementoSource.asObservable();

  avisadorChangeElementoSource = new Subject<ElementoPlantaInterface>();
  avisadorChangeElemento$ = this.avisadorChangeElementoSource.asObservable();

  constructor(public afs: AngularFirestore, private http: HttpClient) {
    this.url = GLOBAL.url;
    // this.informes = afs.collection('informes').valueChanges();
    this.informesCollection = afs.collection<InformeInterface>('informes');
    this.informes$ = this.informesCollection.valueChanges();
  }

  selectElementoPlanta(elementoPlanta: ElementoPlantaInterface) {
    if (elementoPlanta !== this.selectedElementoPlanta) {
      this.selectedElementoPlanta = elementoPlanta;
      this.elementoPlantaSource.next(elementoPlanta);

      if (elementoPlanta !== null) {
        const archivoVuelo = { archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface;
        if (this.selectedArchivoVuelo !== archivoVuelo) {
          this.selectedArchivoVuelo = archivoVuelo;
        }
      }
    }
  }

  selectArchivoVuelo(archivoVuelo: ArchivoVueloInterface) {
    if (this.selectedArchivoVuelo !== archivoVuelo && archivoVuelo !== null) {
      this.selectElementoPlanta(null);
      this.selectedArchivoVuelo = archivoVuelo;
      this.archivoVueloSource.next(archivoVuelo);
    }
  }

  getInformes(): Observable<InformeInterface[]> {
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

  async addEstructuraInforme(informeId: string, estructura: EstructuraInterface) {
    const id = this.afs.createId();
    estructura.id = id;
    const promesa = this.afs.collection('informes').doc(informeId).collection('estructuras').doc(id).set(estructura);

    promesa.then((v) => {
      this.avisadorNuevoElementoSource.next(new Estructura(estructura));
      // this.selectElementoPlanta(estructura);
    });
    return promesa;
  }

  async updateElementoPlanta(informeId: string, elementoPlanta: ElementoPlantaInterface) {
    this.avisadorChangeElementoSource.next(elementoPlanta);
    if (elementoPlanta.constructor.name === Estructura.name) {
      return this.updateEstructura(informeId, elementoPlanta as Estructura);
    }
  }

  async updateEstructura(informeId: string, estructura: EstructuraInterface) {
    const estructuraObj = Object.assign({}, estructura);
    const estructuraDoc = this.afs.doc('informes/' + informeId + '/estructuras/' + estructura.id);
    return estructuraDoc.update(estructuraObj);
  }

  deleteEstructuraInforme(informeId: string, estructura: Estructura): void {
    // const response = new Subject<boolean>();
    const estructuraDoc = this.afs.doc('informes/' + informeId + '/estructuras/' + estructura.id);
    estructuraDoc.delete().then(() => {
      this.avisadorNuevoElementoSource.next(estructura);
    });
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
