import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import moment from 'moment';

import { Map } from 'ol';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';

import { PlantaService } from './planta.service';
import { InformeService } from './informe.service';

import { PuntoTrayectoria } from '@core/models/puntoTrayectoria';
import { PlantaInterface } from '@core/models/planta';
import { Cluster } from '@core/models/cluster';

@Injectable({
  providedIn: 'root',
})
export class ClustersService {
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  informeId: string;
  private vueloId: string = undefined;
  private _planta: PlantaInterface = {};
  public planta$ = new BehaviorSubject<PlantaInterface>(this._planta);
  map: Map;
  puntosTrayectoria: PuntoTrayectoria[] = [];
  puntosTrayectoria$ = new BehaviorSubject<PuntoTrayectoria[]>(this.puntosTrayectoria);
  coordsPuntosTrayectoria: Coordinate[] = [];
  private _puntoHover: PuntoTrayectoria = undefined;
  puntoHover$ = new BehaviorSubject<PuntoTrayectoria>(this._puntoHover);
  private _urlImageThumbnail: string = undefined;
  urlImageThumbnail$ = new BehaviorSubject<string>(this._urlImageThumbnail);
  private clustersRef: AngularFirestoreCollection<Cluster>;
  private _clusters: Cluster[] = [];
  clusters$ = new BehaviorSubject<Cluster[]>(this._clusters);
  private _joinActive = false;
  joinActive$ = new BehaviorSubject<boolean>(this._joinActive);
  private _clusterSelected: Cluster = undefined;
  clusterSelected$ = new BehaviorSubject<Cluster>(this._clusterSelected);
  private _createClusterActive = false;
  createClusterActive$ = new BehaviorSubject<boolean>(this._createClusterActive);

  private subscriptions: Subscription = new Subscription();

  constructor(
    private afs: AngularFirestore,
    private plantaService: PlantaService,
    private storage: AngularFireStorage,
    private router: Router,
    private informeService: InformeService
  ) {}

  initService(): Observable<boolean> {
    // obtenemos el ID de la URL
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    this.subscriptions.add(
      this.informeService
        .getInforme(this.informeId)
        .pipe(
          take(1),
          switchMap((informe) => {
            this.vueloId = informe.vueloId;

            this.clustersRef = this.afs.collection('vuelos/' + this.vueloId + '/clusters');

            return this.plantaService.getPlanta(informe.plantaId);
          })
        )
        .pipe(
          take(1),
          switchMap((planta) => {
            this.planta = planta;

            return combineLatest([this.getPuntosTrayectoria(), this.getClusters()]);
          })
        )
        .subscribe(([puntos, clusters]) => {
          // obtenemos las coordenas de los puntos de la trayectoria
          if (this.coordsPuntosTrayectoria.length === 0) {
            puntos.forEach((punto: any) => this.coordsPuntosTrayectoria.push(fromLonLat([punto.long, punto.lat])));
          }

          // evita que cuando no haya clusters no cargue
          if (clusters === undefined) {
            if (puntos.length > 0) {
              this.initialized$.next(true);
            }
          } else if (clusters.length > 0) {
            if (puntos.length > 0) {
              this.initialized$.next(true);
            }
          }
        })
    );

    return this.initialized$;
  }

  public getVuelos(): Observable<any[]> {
    return this.afs
      .collection('vuelos')
      .snapshotChanges()
      .pipe(
        take(1),
        map((actions) =>
          actions.map((a) => {
            const id = a.payload.doc.id;
            return { id };
          })
        )
      );
  }

  private getPuntosTrayectoria(): Observable<PuntoTrayectoria[]> {
    const puntosTrayectoriaRef = this.afs.collection('vuelos/' + this.vueloId + '/puntosTrayectoria');
    // const puntosTrayectoriaRef = this.afs.collection('vuelos/' + 'Alconera02' + '/puntosTrayectoria');

    this.subscriptions.add(
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
        })
    );

    return this.puntosTrayectoria$;
  }

  private getClusters(): Observable<Cluster[]> {
    this.subscriptions.add(
      this.clustersRef
        .snapshotChanges()
        .pipe(
          map((actions) => {
            return actions.map((a) => {
              const data = a.payload.doc.data() as Cluster;
              data.id = a.payload.doc.id;
              return { ...data };
            });
          })
        )
        .subscribe((clusters) => {
          if (clusters.length > 0) {
            this.clusters = clusters;
          } else {
            this.clusters = undefined;
          }
        })
    );

    return this.clusters$;
  }

  getImageThumbnail(thumbnailId: string) {
    if (thumbnailId !== undefined) {
      // Creamos una referencia a la imagen
      const storageRef = this.storage.ref('');

      let imageExt = '.jpg';
      let imageRef = storageRef.child('vuelos/' + this.vueloId + '/thumbnails/' + thumbnailId + imageExt);

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
              // provamos a ver si existe la imagen antigua en .png
              imageExt = '.png';
              imageRef = storageRef.child('vuelos/' + this.vueloId + '/thumbnails/' + thumbnailId + imageExt);

              // Obtenemos la URL y descargamos el archivo capturando los posibles errores
              imageRef
                .getDownloadURL()
                .toPromise()
                .then((url) => {
                  this.urlImageThumbnail = url;
                })
                .catch((err) => {
                  switch (err.code) {
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
    // obtenemos un ID aleatorio
    const id = this.afs.createId();

    cluster.id = id;

    this.clustersRef
      .doc(id)
      .set(cluster)
      .then((docRef) => {
        console.log('Cluster creado correctamente');
      })
      .catch((error) => {
        console.error('Error creando cluster: ', error);
      });
  }

  updateCluster(clusterId: string, puntoA: boolean, nuevoPuntoId: string) {
    // creamos la referencia al cluster
    const clusterRef = this.clustersRef.doc(clusterId);

    if (puntoA) {
      return clusterRef
        .update({
          puntoAId: nuevoPuntoId,
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
          puntoBId: nuevoPuntoId,
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
    const clusterRef = this.clustersRef.doc(clusterId);

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

  deleteCluster() {
    const clusterId = this.clusterSelected.id;
    // creamos la referencia al cluster
    const clusterRef = this.clustersRef.doc(clusterId);

    clusterRef
      .delete()
      .then(() => console.log('Cluster borrado correctamente'))
      .catch((error) => console.log('Error al borrar el cluster'));

    // eliminamos tambien los JOIN que pudiese haber a este cluster
    this.deleteJoinClusterId(clusterId);
  }

  deleteJoinClusterId(clusterId: string) {
    const clusterSelected = this.clusters.find((c) => c.id === clusterId);

    this.clusters.forEach((cluster) => {
      if (cluster.clusterJoinId === clusterId) {
        const clusterRef = this.clustersRef.doc(cluster.id);

        // eliminamos el campo clusterJoinId
        delete clusterSelected.clusterJoinId;

        // guardamos el cluster sin la propiedad
        clusterRef.set(clusterSelected);
      }
    });
  }

  deleteClustersUnion() {
    const clusterId = this.clusterSelected.id;
    const clusterSelected = this.clusters.find((c) => c.id === clusterId);

    if (clusterSelected.clusterJoinId !== undefined) {
      // creamos la referencia al cluster
      const clusterRef = this.clustersRef.doc(clusterId);

      // eliminamos el campo clusterJoinId
      delete clusterSelected.clusterJoinId;

      // guardamos el cluster sin la propiedad
      clusterRef.set(clusterSelected);
    } else {
      // eliminamos tambien los JOIN que pudiese haber a este cluster
      this.deleteJoinClusterId(clusterId);
    }
  }

  resetService() {
    this._initialized = false;
    this.informeId = undefined;
    this.vueloId = undefined;
    this.planta = {};
    this.puntosTrayectoria = [];
    this.coordsPuntosTrayectoria = [];
    this.puntoHover = undefined;
    this.urlImageThumbnail = undefined;
    this.clustersRef = undefined;
    this.clusters = [];
    this.joinActive = false;
    this.clusterSelected = undefined;
    this.createClusterActive = false;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
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
