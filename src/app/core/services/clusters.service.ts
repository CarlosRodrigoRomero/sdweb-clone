import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, EMPTY, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { Map } from 'ol';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';

import moment from 'moment';

import { PlantaService } from './planta.service';
import { OlMapService } from './ol-map.service';
import { AngularFireStorage } from '@angular/fire/storage';

import { PuntoTrayectoria } from '@core/models/puntoTrayectoria';
import { PlantaInterface } from '@core/models/planta';
import { Cluster } from '@core/models/cluster';

@Injectable({
  providedIn: 'root',
})
export class ClustersService {
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private plantaId: string;
  private _planta: PlantaInterface = {};
  private planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  map: Map;
  puntosTrayectoria: PuntoTrayectoria[] = [];
  puntosTrayectoria$ = new BehaviorSubject<PuntoTrayectoria[]>(this.puntosTrayectoria);
  coordsPuntosTrayectoria: Coordinate[] = [];
  private _puntoHover: PuntoTrayectoria = undefined;
  puntoHover$ = new BehaviorSubject<PuntoTrayectoria>(this._puntoHover);
  private _urlImageThumbnail: string = undefined;
  urlImageThumbnail$ = new BehaviorSubject<string>(this._urlImageThumbnail);
  private _clusters: Cluster[] = [];
  clusters$ = new BehaviorSubject<Cluster[]>(this._clusters);
  private _deleteMode = false;
  deleteMode$ = new BehaviorSubject<boolean>(this._deleteMode);
  private _joinActive = false;
  joinActive$ = new BehaviorSubject<boolean>(this._joinActive);
  private _clusterSelected: Cluster = undefined;
  clusterSelected$ = new BehaviorSubject<Cluster>(this._clusterSelected);
  private _createClusterActive = false;
  createClusterActive$ = new BehaviorSubject<boolean>(this._createClusterActive);

  constructor(
    private afs: AngularFirestore,
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private storage: AngularFireStorage
  ) {}

  initService(): Observable<boolean> {
    this.plantaId = '1J6YwrECCGrXcEzrkjau';

    this.plantaService
      .getPlanta(this.plantaId)
      .pipe(
        take(1),
        switchMap((planta) => {
          this.planta = planta;
          return combineLatest([this.getPuntosTrayectoria(this.plantaId), this.getClusters(this.plantaId)]);
        })
      )
      .subscribe(([puntos, clusters]) => {
        // obtenemos las coordenas de los puntos de la trayectoria
        puntos.forEach((punto: any) => this.coordsPuntosTrayectoria.push(fromLonLat([punto.long, punto.lat])));

        // TODO: evitar que cuando no haya clusters no cargue
        if (puntos.length > 0 && clusters.length > 0) {
          this.initialized$.next(true);
        }
      });

    return this.initialized$;
  }

  private getPuntosTrayectoria(plantaId: string): Observable<PuntoTrayectoria[]> {
    // const puntosTrayectoriaRef = this.afs.collection('vuelos/' + plantaId + '/puntosTrayectoria');
    const puntosTrayectoriaRef = this.afs.collection('vuelos/' + 'Alconera02' + '/puntosTrayectoria');

    puntosTrayectoriaRef
      .snapshotChanges()
      .pipe(
        take(1),
        map((actions) => {
          return actions.map((a) => {
            const data = a.payload.doc.data() as PuntoTrayectoria;
            const id = a.payload.doc.id;
            return { id, ...data };
          });
        })
      )
      .subscribe((puntos) => {
        // ordenamos los puntos por fecha
        this.puntosTrayectoria = puntos.sort((a, b) => this.dateStringToUnix(a.date) - this.dateStringToUnix(b.date));
        this.puntosTrayectoria$.next(this.puntosTrayectoria);
      });

    return this.puntosTrayectoria$;
  }

  private getClusters(plantaId: string): Observable<Cluster[]> {
    // const clustersRef = this.afs.collection('vuelos/' + plantaId + '/clusters');
    const clustersRef = this.afs.collection('vuelos/' + 'Alconera02' + '/clusters'); // DEMO

    clustersRef
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data = a.payload.doc.data() as Cluster;
            const id = a.payload.doc.id;
            return { id, ...data };
          });
        })
      )
      .subscribe((clusters) => (this.clusters = clusters));

    return this.clusters$;
  }

  getImageThumbnail(thumbnailId: string) {
    if (thumbnailId !== undefined) {
      // Creamos una referencia a la imagen
      const storageRef = this.storage.ref('');
      const imageRef = storageRef.child('vuelos/Alconera02/thumbnails/' + thumbnailId + '.png');

      // Obtenemos la URL y descargamos el archivo capturando los posibles errores
      imageRef
        .getDownloadURL()
        .toPromise()
        .then((url) => {
          this.urlImageThumbnail = url;
        })
        .catch((error) => {
          switch (error.code) {
            case 'storage/object-not-found':
              console.log("File doesn't exist");
              break;

            case 'storage/unauthorized':
              console.log("User doesn't have permission to access the object");
              break;

            case 'storage/canceled':
              console.log('User canceled the upload');
              break;

            case 'storage/unknown':
              console.log('Unknown error occurred, inspect the server response');
              break;
          }
        });
    }
  }

  private dateStringToUnix(date: string) {
    const n = moment(date, 'DD/MM/YYYY hh:mm:ss').unix();

    return n;
  }

  addCluster(cluster: Cluster) {
    // creamos la referencia a la colección de clusters
    const clustersRef = this.afs.collection('vuelos/Alconera02/clusters');

    // obtenemos un ID aleatorio
    const id = this.afs.createId();

    cluster.id = id;

    clustersRef
      .doc(id)
      .set(cluster)
      .then((docRef) => {
        console.log('Cluster creado correctemente');
      })
      .catch((error) => {
        console.error('Error creando cluster: ', error);
      });
  }

  updateCluster(clusterId: string, extremoA: boolean, coords: Coordinate) {
    // creamos la referencia al cluster
    const clusterRef = this.afs.collection('vuelos/Alconera02/clusters').doc(clusterId);

    if (extremoA) {
      return clusterRef
        .update({
          extremoA: coords as Coordinate,
        })
        .then(() => {
          console.log('Cluster successfully updated!');
        })
        .catch((error) => {
          // The document probably doesn't exist.
          console.error('Error updating cluster: ', error);
        });
    } else {
      return clusterRef
        .update({
          extremoB: coords,
        })
        .then(() => {
          console.log('Cluster successfully updated!');
        })
        .catch((error) => {
          // The document probably doesn't exist.
          console.error('Error updating cluster: ', error);
        });
    }
  }

  joinClusters(clusterId: string, clusterJoinId: string) {
    // creamos la referencia al cluster
    const clusterRef = this.afs.collection('vuelos/Alconera02/clusters').doc(clusterId);

    return clusterRef
      .update({
        clusterJoinId,
      })
      .then(() => {
        console.log('Cluster successfully updated!');
      })
      .catch((error) => {
        // The document probably doesn't exist.
        console.error('Error updating cluster: ', error);
      });
  }

  deleteCluster(clusterId: string) {
    // creamos la referencia al cluster
    const clusterRef = this.afs.collection('vuelos/Alconera02/clusters').doc(clusterId);

    clusterRef
      .delete()
      .then(() => console.log('Cluster borrado correctamente'))
      .catch((error) => console.log('Error al borrar el cluster'));

    // eliminamos tambien los JOIN que pudiese haber a este cluster
    this.deleteJoinClusterId(clusterId);
  }

  deleteJoinClusterId(clusterId: string) {
    this.clusters.forEach((cluster) => {
      if (cluster.clusterJoinId === clusterId) {
        const clusterRef = this.afs.collection('vuelos/Alconera02/clusters').doc(cluster.id);
        clusterRef.update({
          clusterJoinId: firebase.firestore.FieldValue.delete(),
        });
      }
    });
  }

  get planta() {
    return this._planta;
  }

  set planta(value: PlantaInterface) {
    this._planta = value;
    this.planta$.next(value);
  }

  get puntoHover() {
    return this._puntoHover;
  }

  set puntoHover(value: PuntoTrayectoria) {
    this._puntoHover = value;
    this.puntoHover$.next(value);
  }

  get urlImageThumbnail() {
    return this._urlImageThumbnail;
  }

  set urlImageThumbnail(value: string) {
    this._urlImageThumbnail = value;
    this.urlImageThumbnail$.next(value);
  }

  get clusters() {
    return this._clusters;
  }

  set clusters(value: Cluster[]) {
    this._clusters = value;
    this.clusters$.next(value);
  }

  get deleteMode() {
    return this._deleteMode;
  }

  set deleteMode(value: boolean) {
    this._deleteMode = value;
    this.deleteMode$.next(value);
  }

  get joinActive() {
    return this._joinActive;
  }

  set joinActive(value: boolean) {
    this._joinActive = value;
    this.joinActive$.next(value);
  }

  get clusterSelected() {
    return this._clusterSelected;
  }

  set clusterSelected(value: Cluster) {
    this._clusterSelected = value;
    this.clusterSelected$.next(value);
  }

  get createClusterActive() {
    return this._createClusterActive;
  }

  set createClusterActive(value: boolean) {
    this._createClusterActive = value;
    this.createClusterActive$.next(value);
  }
}
