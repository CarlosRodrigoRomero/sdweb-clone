import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { PlantaInterface } from 'src/app/models/planta';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { LocationAreaInterface } from '../models/location';

import { UserInterface } from '../models/user';
import { ModuloInterface } from '../models/modulo';
import * as firebase from 'firebase/app';
import { PcInterface } from '../models/pc';
import { UserAreaInterface } from '../models/userArea';
import { AuthService } from './auth.service';
import { GLOBAL } from './global';
import { CriteriosClasificacion } from '../models/criteriosClasificacion';
import { LatLngLiteral } from '@agm/core/map-types';
declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class PlantaService {
  public planta$: Observable<PlantaInterface>;
  public planta: PlantaInterface;
  private plantaDoc: AngularFirestoreDocument<PlantaInterface>;
  public plantasCollection: AngularFirestoreCollection<PlantaInterface>;
  public modulos: ModuloInterface[];
  private filteredLocAreasSource = new BehaviorSubject<LocationAreaInterface[]>(new Array<LocationAreaInterface>());
  public currentFilteredLocAreas$ = this.filteredLocAreasSource.asObservable();
  public locAreaList: LocationAreaInterface[];

  constructor(private afs: AngularFirestore, public auth: AuthService) {
    this.getModulos().subscribe((modulos) => {
      this.modulos = modulos;
    });
  }

  getPlanta(plantaId: string): Observable<PlantaInterface> {
    this.plantaDoc = this.afs.doc<PlantaInterface>('plantas/' + plantaId);

    return (this.planta$ = this.plantaDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as PlantaInterface;
          data.id = action.payload.id;
          return data;
        }
      })
    ));
  }

  updatePlanta(planta: PlantaInterface): void {
    const plantaDoc = this.afs.doc(`plantas/${planta.id}`);
    plantaDoc.update(planta);
  }

  getPlantas() {
    return this.plantasCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as PlantaInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }
  addUserArea(plantaId: string, userArea: UserAreaInterface) {
    const id = this.afs.createId();
    userArea.id = id;

    this.afs.collection('plantas').doc(plantaId).collection('userAreas').doc(id).set(userArea);

    return userArea;
  }
  updateUserArea(userArea: UserAreaInterface) {
    const userAreaDoc = this.afs.doc(`plantas/${userArea.plantaId}/userAreas/${userArea.id}`);
    userAreaDoc.update(userArea);
  }

  getAllUserAreas(plantaId: string): Observable<UserAreaInterface[]> {
    const query$ = this.afs.collection('plantas').doc(plantaId).collection('userAreas');

    const result = query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as LocationAreaInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );

    return result;
  }

  getUserAreas$(plantaId: string): Observable<UserAreaInterface[]> {
    return this.auth.user$.pipe(
      map((user) => {
        return user.uid;
      }),
      switchMap((userId) => {
        return this.afs
          .collection<UserAreaInterface>(`plantas/${plantaId}/userAreas/`, (ref) => ref.where('userId', '==', userId))
          .valueChanges();
      })
    );
  }

  async delUserArea(userArea: UserAreaInterface) {
    return this.afs.collection('plantas').doc(userArea.plantaId).collection('userAreas').doc(userArea.id).delete();
  }

  async addLocationArea(plantaId: string, locationArea: LocationAreaInterface) {
    const id = this.afs.createId();
    locationArea.id = id;

    return this.afs.collection('plantas').doc(plantaId).collection('locationAreas').doc(id).set(locationArea);
  }

  async updateLocationArea(locArea: LocationAreaInterface) {
    const LocAreaDoc = this.afs.doc(`plantas/${locArea.plantaId}/locationAreas/${locArea.id}`);
    if (!locArea.hasOwnProperty('modulo')) {
      LocAreaDoc.update({
        modulo: firebase.firestore.FieldValue.delete(),
      });
    }
    return LocAreaDoc.update(locArea);
  }

  delLocationArea(locationArea: LocationAreaInterface) {
    this.afs.collection('plantas').doc(locationArea.plantaId).collection('locationAreas').doc(locationArea.id).delete();
  }

  getLocationsArea(plantaId: string): Observable<LocationAreaInterface[]> {
    const query$ = this.afs.collection('plantas').doc(plantaId).collection('locationAreas');

    const result = query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as LocationAreaInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );

    return result;
  }

  getPlantasDeEmpresa(user: UserInterface): Observable<PlantaInterface[]> {
    let query$: AngularFirestoreCollection<PlantaInterface>;
    if (user.role === 2) {
      query$ = this.afs.collection<PlantaInterface>('plantas');
      return query$.snapshotChanges().pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as PlantaInterface;
            data.id = a.payload.doc.id;
            return data;
          })
        ),
        map((plantas) => {
          return plantas.filter((planta) => {
            return user.plantas.includes(planta.id);
          });
        })
      );
    } else if (this.auth.userIsAdmin(user)) {
      query$ = this.afs.collection<PlantaInterface>('plantas');
    } else {
      query$ = this.afs.collection<PlantaInterface>('plantas', (ref) => ref.where('empresa', '==', user.uid));
    }

    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as PlantaInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getModulosPlanta(planta: PlantaInterface): ModuloInterface[] {
    if (planta.hasOwnProperty('modulos')) {
      if (planta.modulos.length > 0) {
        return this.modulos.filter((item) => {
          return planta.modulos.indexOf(item.id) >= 0;
        });
      }
    }
    return this.modulos;
  }

  getModulos(): Observable<ModuloInterface[]> {
    let query$: AngularFirestoreCollection<ModuloInterface>;

    query$ = this.afs.collection<ModuloInterface>('modulos');

    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as ModuloInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getNumeroModulo(pc: PcInterface): string {
    const altura = this.getAltura(this.planta, pc.local_y);
    if (
      this.planta.hasOwnProperty('etiquetasLocalXY') &&
      this.planta.etiquetasLocalXY[altura] !== undefined &&
      this.planta.etiquetasLocalXY[altura][pc.local_x - 1] !== undefined
    ) {
      return this.planta.etiquetasLocalXY[altura][pc.local_x - 1];
    }

    return this.getEtiquetaLocalX(this.planta, pc)
      .toString()
      .concat('/')
      .concat(this.getEtiquetaLocalY(this.planta, pc).toString());
  }

  getAltura(planta: PlantaInterface, localY: number) {
    // Por defecto, la altura alta es la numero 1
    if (planta.alturaBajaPrimero) {
      return planta.filas - (localY - 1);
    } else {
      return localY;
    }
  }

  getEtiquetaLocalX(planta: PlantaInterface, pc: PcInterface) {
    if (pc.local_x <= 0) {
      return GLOBAL.stringParaDesconocido;
    }
    if (planta.hasOwnProperty('etiquetasLocalX')) {
      const localX = pc.local_x > planta.etiquetasLocalX.length ? planta.etiquetasLocalX.length : pc.local_x;
      return planta.etiquetasLocalX[localX - 1];
    }
    return pc.local_x;
  }
  getEtiquetaLocalY(planta: PlantaInterface, pc: PcInterface) {
    if (pc.local_y <= 0) {
      return GLOBAL.stringParaDesconocido;
    }
    if (planta.hasOwnProperty('etiquetasLocalY')) {
      const localY = pc.local_y > planta.etiquetasLocalY.length ? planta.etiquetasLocalY.length : pc.local_y;
      if (planta.alturaBajaPrimero) {
        return planta.etiquetasLocalY[localY - 1];
      }
      return planta.etiquetasLocalY[planta.etiquetasLocalY.length - localY];
    }
    return this.getAltura(planta, pc.local_y);
  }

  getNombreSeguidor(pc: PcInterface) {
    let nombreSeguidor = '';
    if (pc.hasOwnProperty('global_x')) {
      if (!Number.isNaN(pc.global_x) && pc.global_x !== null) {
        nombreSeguidor = nombreSeguidor.concat(pc.global_x.toString());
      }
    }
    if (pc.hasOwnProperty('global_y')) {
      if (!Number.isNaN(pc.global_y) && pc.global_y !== null) {
        if (nombreSeguidor.length > 0) {
          nombreSeguidor = nombreSeguidor.concat(this.getGlobalsConector());
        }
        nombreSeguidor = nombreSeguidor.concat(pc.global_y.toString());
      }
    }
    if (pc.hasOwnProperty('global_z')) {
      if (!Number.isNaN(pc.global_z) && pc.global_z !== null) {
        if (nombreSeguidor.length > 0) {
          nombreSeguidor = nombreSeguidor.concat(this.getGlobalsConector());
        }
        nombreSeguidor = nombreSeguidor.concat(pc.global_z.toString());
      }
    }
    return nombreSeguidor;
  }

  getEtiquetaGlobals(pc: PcInterface): string {
    let nombreEtiqueta = '';
    if (pc.hasOwnProperty('global_x') && !Number.isNaN(pc.global_x) && pc.global_x !== null) {
      nombreEtiqueta = nombreEtiqueta.concat(pc.global_x.toString());
    }
    if (pc.hasOwnProperty('global_y') && !Number.isNaN(pc.global_y) && pc.global_y !== null) {
      if (nombreEtiqueta.length > 0) {
        nombreEtiqueta = nombreEtiqueta.concat(this.getGlobalsConector());
      }
      nombreEtiqueta = nombreEtiqueta.concat(pc.global_y.toString());
    }
    return nombreEtiqueta;
  }
  getGlobalCoordsColumns(planta: PlantaInterface, columnsToDisplay: string[]): string[] {
    if (planta.tipo === 'seguidores') {
      let count = 0;
      if (planta.hasOwnProperty('nombreGlobalX')) {
        count += 1;
        columnsToDisplay.push('global_x');
      }
      if (planta.hasOwnProperty('nombreGlobalY')) {
        count += 1;
        columnsToDisplay.push('global_y');
      }
      if (planta.hasOwnProperty('nombreGlobalZ')) {
        count += 1;
        columnsToDisplay.push('global_z');
      }
      if (count === 0) {
        columnsToDisplay.push('seguidor');
      }
    } else {
      columnsToDisplay.push('global_x');
      if (planta.hasOwnProperty('numeroGlobalCoords')) {
        if (planta.numeroGlobalCoords >= 2) {
          columnsToDisplay.push('global_y');
        }
        // if (planta.numeroGlobalCoords === 3) {
        //   columnsToDisplay.push('global_z');
        // }
      } else {
        columnsToDisplay.push('global_y');
      }
    }
    return columnsToDisplay;
  }

  getGlobalsConector(): string {
    if (this.planta.hasOwnProperty('stringConectorGlobals')) {
      return this.planta.stringConectorGlobals;
    }

    return GLOBAL.stringConectorGlobalsDefault;
  }

  getNombreColsGlobal(planta: PlantaInterface) {
    let nombreCol = this.getNombreGlobalX(planta);
    if (nombreCol.length > 0) {
      nombreCol = nombreCol.concat(this.getGlobalsConector());
    }
    nombreCol = nombreCol.concat(this.getNombreGlobalY(planta));
    // let nombreCol = "";
    // if (planta.hasOwnProperty("nombreGlobalX")) {
    //   nombreCol = nombreCol.concat(planta.nombreGlobalX.toString());
    // }
    // if (planta.hasOwnProperty("nombreGlobalY")) {
    //   if (nombreCol.length > 0) {
    //     nombreCol = nombreCol.concat("/");
    //   }
    //   nombreCol = nombreCol.concat(planta.nombreGlobalY.toString());
    // }
    // if (nombreCol.length === 0) {
    //   nombreCol = "Pasillo"
    // }
    return nombreCol;
  }

  getReferenciaSolardrone(planta: PlantaInterface) {
    return !planta.hasOwnProperty('referenciaSolardrone') || planta.referenciaSolardrone;
  }

  getCriterio(criterioId: string): Observable<CriteriosClasificacion> {
    const criterioDoc = this.afs.doc<CriteriosClasificacion>('criteriosClasificacion/' + criterioId);

    return criterioDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as CriteriosClasificacion;
          data.id = action.payload.id;
          return data;
        }
      })
    );
  }

  getCriterios(): Observable<CriteriosClasificacion[]> {
    let query$: AngularFirestoreCollection<CriteriosClasificacion>;

    query$ = this.afs.collection<CriteriosClasificacion>('criteriosClasificacion');

    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as CriteriosClasificacion;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  set(planta: PlantaInterface) {
    this.planta = planta;
  }
  get() {
    return this.planta;
  }
  getNombreGlobalX(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalX')) {
        return planta.nombreGlobalX;
      }
      return GLOBAL.nombreGlobalXFija;
    }
    return '';
  }
  getNombreGlobalY(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalY')) {
        return planta.nombreGlobalY;
      }
      return GLOBAL.nombreGlobalYFija;
    }
    return '';
  }

  getNombreGlobalZ(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalZ')) {
        return planta.nombreGlobalZ;
      }
      return GLOBAL.nombreGlobalZFija;
    }
    return '';
  }
  getNombreLocalX(planta: PlantaInterface): string {
    if (planta.hasOwnProperty('nombreLocalX')) {
      return planta.nombreLocalX;
    }
    return GLOBAL.nombreLocalXFija;
  }

  getNombreLocalY(planta: PlantaInterface): string {
    if (planta.hasOwnProperty('nombreLocalY')) {
      return planta.nombreLocalY;
    }
    return GLOBAL.nombreLocalYFija;
  }
  setLocAreaList(locAreaList: LocationAreaInterface[]) {
    this.locAreaList = locAreaList;
  }

  getGlobalCoordsFromLocationArea(coords: LatLngLiteral) {
    const latLng = new google.maps.LatLng(coords.lat, coords.lng);

    const globalCoords = [null, null, null];
    let modulo: ModuloInterface = {};

    if (this.locAreaList !== undefined) {
      this.locAreaList.forEach((polygon, i, array) => {
        if (google.maps.geometry.poly.containsLocation(latLng, polygon)) {
          if (polygon.globalX.length > 0) {
            globalCoords[0] = polygon.globalX;
          }
          if (polygon.globalY.length > 0) {
            globalCoords[1] = polygon.globalY;
          }
          if (polygon.hasOwnProperty('globalCoords') && polygon.globalCoords !== undefined) {
            polygon.globalCoords.forEach((item, index) => {
              if (item !== null && item.length > 0) {
                globalCoords[index] = item;
              }
            });
          }

          if (polygon.hasOwnProperty('modulo')) {
            if (polygon.modulo !== undefined) {
              modulo = polygon.modulo;
            }
          }
        }
      });
    }

    return [globalCoords, modulo];
  }

  initMap(planta: PlantaInterface, map: any) {
    if (planta.hasOwnProperty('ortofoto')) {
      const ortofoto = planta.ortofoto;
      map.setOptions({ maxZoom: ortofoto.mapMaxZoom });
      map.setOptions({ minZoom: ortofoto.mapMinZoom });
      map.mapTypeId = 'roadmap';
      const mapBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(ortofoto.bounds.south, ortofoto.bounds.west),
        new google.maps.LatLng(ortofoto.bounds.north, ortofoto.bounds.east)
      );

      const imageMapType = new google.maps.ImageMapType({
        getTileUrl(coord, zoom) {
          const proj = map.getProjection();
          const z2 = Math.pow(2, zoom);
          const tileXSize = 256 / z2;
          const tileYSize = 256 / z2;
          const tileBounds = new google.maps.LatLngBounds(
            proj.fromPointToLatLng(new google.maps.Point(coord.x * tileXSize, (coord.y + 1) * tileYSize)),
            proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * tileXSize, coord.y * tileYSize))
          );
          if (!mapBounds.intersects(tileBounds) || zoom < ortofoto.mapMinZoom || zoom > ortofoto.mapMaxZoom) {
            return null;
          }
          return `${ortofoto.url}/${zoom}/${coord.x}/${coord.y}.png`;
        },
        tileSize: new google.maps.Size(256, 256),
        name: 'Tiles',
      });

      map.overlayMapTypes.push(imageMapType);
      map.fitBounds(mapBounds);
    }
  }
}
