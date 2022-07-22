import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';

import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { LatLng as number, LatLngLiteral } from '@agm/core';

import { GLOBAL } from '@data/constants/global';
import { PlantaService } from '@data/services/planta.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { InformeInterface } from '@core/models/informe';
import { EstructuraInterface, Estructura } from '@core/models/estructura';
import { ArchivoVueloInterface } from '@core/models/archivoVuelo';
import { ElementoPlantaInterface } from '@core/models/elementoPlanta';
import { PcInterface } from '@core/models/pc';
import { PlantaInterface } from '@core/models/planta';

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
  private selectedPcSource = new Subject<PcInterface>();
  selectedPc$ = this.selectedPcSource.asObservable();
  private archivoVueloSource = new Subject<ArchivoVueloInterface>();
  selectedArchivoVuelo$ = this.archivoVueloSource.asObservable();
  droneLatLng = new Subject<LatLngLiteral>();
  droneLatLng$ = this.droneLatLng.asObservable();

  avisadorNuevoElementoSource = new Subject<ElementoPlantaInterface>();
  avisadorNuevoElemento$ = this.avisadorNuevoElementoSource.asObservable();

  avisadorChangeElementoSource = new Subject<ElementoPlantaInterface>();
  avisadorChangeElemento$ = this.avisadorChangeElementoSource.asObservable();

  private _avisadorMoveElements = false;
  public avisadorMoveElements$ = new BehaviorSubject<boolean>(this._avisadorMoveElements);

  public allElementosPlanta: ElementoPlantaInterface[] = [];

  constructor(public afs: AngularFirestore, private http: HttpClient, private plantaService: PlantaService) {
    this.url = GLOBAL.url;
    // this.informes = afs.collection('informes').valueChanges();
    this.informesCollection = afs.collection<InformeInterface>('informes');
    this.informes$ = this.informesCollection.valueChanges();
  }

  uncheckPc() {
    this.selectedPcSource.next(null);
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
          if (data.tiposAnomalias !== undefined && data.tiposAnomalias !== null) {
            data.tiposAnomalias = Object.values(data.tiposAnomalias);
          }
          return data;
        })
      )
    );
  }

  getInformesDisponiblesDePlanta(plantaId: string): Observable<InformeInterface[]> {
    const query$ = this.afs.collection<InformeInterface>('informes', (ref) => ref.where('plantaId', '==', plantaId));
    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as InformeInterface;
          data.id = a.payload.doc.id;
          if (data.tiposAnomalias !== undefined && data.tiposAnomalias !== null) {
            data.tiposAnomalias = Object.values(data.tiposAnomalias);
          }
          return data;
        })
      ),
      // solo traemos los disponibles
      map((informes) => informes.filter((informe) => informe.disponible)),
      // los ordenamos por fecha
      map((informes) => informes.sort((a, b) => a.fecha - b.fecha)),
      // nos quedamos con los 2 más recientes por el momento
      map((informes) =>
        informes.filter((informe, index) => index === informes.length - 1 || index === informes.length - 2)
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
          if (data.tiposAnomalias !== undefined && data.tiposAnomalias !== null) {
            data.tiposAnomalias = Object.values(data.tiposAnomalias);
          }
          return data;
        })
      ),
      // los ordenamos por fecha
      map((informes) => informes.sort((a, b) => a.fecha - b.fecha)),
      // nos quedamos con los 2 más recientes por el momento
      map((informes) =>
        informes.filter((informe, index) => index === informes.length - 1 || index === informes.length - 2)
      )
    );
  }

  getInformesDisponiblesDeEmpresa(empresaId: string): Observable<InformeInterface[]> {
    const query$ = this.afs.collection<InformeInterface>('informes', (ref) => ref.where('empresaId', '==', empresaId));
    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as InformeInterface;
          data.id = a.payload.doc.id;
          if (data.tiposAnomalias !== undefined && data.tiposAnomalias !== null) {
            data.tiposAnomalias = Object.values(data.tiposAnomalias);
          }
          return data;
        })
      ),
      // solo traemos los disponibles
      map((informes) => informes.filter((informe) => informe.disponible)),
      // los ordenamos por fecha
      map((informes) => informes.sort((a, b) => a.fecha - b.fecha)),
      // nos quedamos con los 2 más recientes por el momento
      map((informes) =>
        informes.filter((informe, index) => index === informes.length - 1 || index === informes.length - 2)
      )
    );
  }

  getInformesDeEmpresa(empresaId: string): Observable<InformeInterface[]> {
    const query$ = this.afs.collection<InformeInterface>('informes', (ref) => ref.where('empresaId', '==', empresaId));
    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as InformeInterface;

          if (data.hasOwnProperty('empresaId')) {
            return null;
          } else {
            data.id = a.payload.doc.id;
            if (data.tiposAnomalias !== undefined && data.tiposAnomalias !== null) {
              data.tiposAnomalias = Object.values(data.tiposAnomalias);
            }
            return data;
          }
        })
      ),
      // los ordenamos por fecha
      map((informes) => informes.sort((a, b) => a.fecha - b.fecha)),
      // nos quedamos con los 2 más recientes por el momento
      map((informes) =>
        informes.filter((informe, index) => index === informes.length - 1 || index === informes.length - 2)
      )
    );
  }

  getInforme(id: string): Observable<InformeInterface> {
    this.informeDoc = this.afs.doc<InformeInterface>('informes/' + id);

    return (this.informe$ = this.informeDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as InformeInterface;
          data.id = action.payload.id;
          if (data.tiposAnomalias !== undefined && data.tiposAnomalias !== null) {
            data.tiposAnomalias = Object.values(data.tiposAnomalias);
          }
          return data;
        }
      })
    ));
  }

  getOnlyNewInfomesFijas(informes: InformeInterface[]) {
    // solo permitimos los informes nuevos en fijas, exluyendo el informe DEMO
    return informes.filter(
      (informe) => informe.fecha > GLOBAL.newReportsDate || informe.plantaId === 'egF0cbpXnnBnjcrusoeR'
    );
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

  async addAutoEstructuraInforme(informeId: string, estructura: EstructuraInterface) {
    const id = this.afs.createId();
    estructura.id = id;
    const promesa = this.afs.collection('informes').doc(informeId).collection('autoEstructura').doc(id).set(estructura);

    promesa.then((v) => {
      this.avisadorNuevoElementoSource.next(new Estructura(estructura));
      // this.selectElementoPlanta(estructura);
    });
    return promesa;
  }

  async updateElementoPlanta(informeId: string, elementoPlanta: ElementoPlantaInterface) {
    if (elementoPlanta.constructor.name === Estructura.name) {
      if ((elementoPlanta as Estructura).estructuraMatrix === null) {
        return this.updateAutoEstructura(informeId, elementoPlanta as Estructura);
      } else {
        return this.updateEstructura(informeId, elementoPlanta as Estructura);
      }
    }
  }

  async updateEstructura(informeId: string, estructura: EstructuraInterface) {
    // no guardamos estructuraCoords
    delete estructura.estructuraCoords;

    const estructuraObj = Object.assign({}, estructura);
    const estructuraDoc = this.afs.doc('informes/' + informeId + '/estructuras/' + estructura.id);
    return estructuraDoc.update(estructuraObj);
  }

  public updateEstructuraField(id: string, informeId: string, field: string, value: any) {
    const estructura = {};
    estructura[field] = value;

    this.afs.doc('informes/' + informeId + '/estructuras/' + id).update(estructura);
  }

  async updateAutoEstructura(informeId: string, estructura: EstructuraInterface) {
    const estructuraDoc = this.afs.doc('informes/' + informeId + '/autoEstructura/' + estructura.id);

    return estructuraDoc.update({
      latitud: estructura.latitud,
      longitud: estructura.longitud,
      globalCoords: estructura.globalCoords,
      modulo: estructura.modulo,
    });
  }

  public updateAutoEstructuraField(id: string, informeId: string, field: string, value: any) {
    const estructura = {};
    estructura[field] = value;

    return this.afs.doc('informes/' + informeId + '/autoEstructura/' + id).update(estructura);
  }

  public onMapElementoPlantaDragEnd(
    informeId: string,
    planta: PlantaInterface,
    elementoPlanta: ElementoPlantaInterface
  ) {
    const latLng = elementoPlanta.getLatLng();
    if (planta.tipo === 'seguidores') {
      this.allElementosPlanta
        .filter((elem) => {
          return elem.archivo === elementoPlanta.archivo;
        })
        .forEach((elem) => {
          this.changeLocationElementoPlanta(informeId, elem, latLng);
        });
    } else {
      this.changeLocationElementoPlanta(informeId, elementoPlanta, latLng);
    }
  }

  public changeLocationElementoPlanta(
    informeId: string,
    elementoPlanta: ElementoPlantaInterface,
    coords: LatLngLiteral
  ) {
    elementoPlanta.setLatLng({ lat: coords.lat, lng: coords.lng });

    let globalCoords;
    let modulo;
    [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(elementoPlanta.getLatLng());

    elementoPlanta.setGlobals(globalCoords);
    elementoPlanta.setModulo(modulo);

    this.updateElementoPlanta(informeId, elementoPlanta);
  }

  public onMapElementoPlantaClick(elementoPlanta: ElementoPlantaInterface): void {
    this.selectElementoPlanta(elementoPlanta);
  }

  deleteEstructuraInforme(informeId: string, estructura: Estructura): void {
    // const response = new Subject<boolean>();
    const estructuraDoc = this.afs.doc('informes/' + informeId + '/estructuras/' + estructura.id);
    estructuraDoc.delete().then(() => {
      this.avisadorNuevoElementoSource.next(estructura);
    });
  }

  deleteAutoEstructuraInforme(informeId: string, estructura: Estructura): void {
    // const response = new Subject<boolean>();
    const estructuraDoc = this.afs.doc('informes/' + informeId + '/autoEstructura/' + estructura.id);
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

  getAutoEstructuraInforme(informeId: string, currentFileName: string): Observable<Estructura[]> {
    const query$ = this.afs
      .collection('informes')
      .doc(informeId)
      .collection('autoEstructura', (ref) => ref.where('archivo', '==', currentFileName));

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

  getAllAutoEstructuras(informeId: string): Observable<Estructura[]> {
    const query$ = this.afs.collection('informes').doc(informeId).collection('autoEstructura');

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
    informe.tiposAnomalias = { ...informe.tiposAnomalias };

    this.afs
      .collection('informes')
      .doc(informe.id)
      .update(informe)
      .then(() => {
        console.log('Informe actualizado correctamente');
      })
      .catch((error) => {
        console.error('Error al actualizar el informe: ', error);
      });
  }

  updateInformeField(id: string, field: string, value: any) {
    const informe = {};
    informe[field] = value;

    this.afs
      .collection('informes')
      .doc(id)
      .update(informe)
      .then(() => {
        console.log('Informe actualizado correctamente');
      })
      .catch((error) => {
        console.error('Error al actualizar el informe: ', error);
      });
  }

  addInforme(informe: InformeInterface) {
    informe.id = this.afs.createId();

    this.afs
      .collection('informes')
      .doc(informe.id)
      .set(informe)
      .then((docRef) => {
        console.log('Informe creado con ID: ', informe.id);
      })
      .catch((error) => {
        console.error('Error al crear el informe: ', error);
      });
  }

  editInforme() {}

  set(informe: InformeInterface) {
    this.informe = informe;
  }

  get() {
    return this.informe;
  }

  getDateLabelInforme(informe: InformeInterface): string {
    return this.unixToDateLabel(informe.fecha);
  }

  getDateLabelsInformes(informesId: string[]): Observable<string[]> {
    return combineLatest(
      informesId.map((informeId) =>
        this.getInforme(informeId).pipe(
          take(1),
          map((informe) => this.unixToDateLabel(informe.fecha))
        )
      )
    );
  }

  private unixToDateLabel(unix: number): string {
    const date = new Date(unix * 1000);
    const year = date.getFullYear();
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const month = monthNames[date.getMonth()];

    return month + ' ' + year;
  }

  getInformesWithEmpresaId(informes: InformeInterface[], empresaId: string): InformeInterface[] {
    return informes.filter((informe) => informe.hasOwnProperty('empresaId') && informe.empresaId === empresaId);
  }

  ///////////////////////////////////////////////////////

  get avisadorMoveElements() {
    return this._avisadorMoveElements;
  }

  set avisadorMoveElements(value: boolean) {
    this._avisadorMoveElements = value;
    this.avisadorMoveElements$.next(value);
  }
}
