import { Injectable } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection
} from "@angular/fire/firestore";
import { PlantaInterface } from "src/app/models/planta";
import { Observable, BehaviorSubject } from "rxjs";
import { map, filter, switchMap } from "rxjs/operators";
import { LocationAreaInterface } from "../models/location";

import { UserInterface } from "../models/user";
import { ModuloInterface } from "../models/modulo";
import * as firebase from "firebase/app";
import { PcInterface } from "../models/pc";
import { UserAreaInterface } from "../models/userArea";
import { AuthService } from "./auth.service";
import { GLOBAL } from "./global";
import { CriteriosClasificacion } from "../models/criteriosClasificacion";

@Injectable({
  providedIn: "root"
})
export class PlantaService {
  public itemDoc: AngularFirestoreDocument<PlantaInterface>;
  public plantas: Observable<PlantaInterface[]>;
  public planta: Observable<PlantaInterface>;
  private plantaDoc: AngularFirestoreDocument<PlantaInterface>;
  public plantasCollection: AngularFirestoreCollection<PlantaInterface>;
  public modulos: ModuloInterface[];
  private filteredLocAreasSource = new BehaviorSubject<LocationAreaInterface[]>(
    new Array<LocationAreaInterface>()
  );
  public currentFilteredLocAreas$ = this.filteredLocAreasSource.asObservable();

  constructor(private afs: AngularFirestore, public auth: AuthService) {
    // this.plantas = afs.collection("plantas").valueChanges();
    this.getModulos().subscribe(modulos => {
      this.modulos = modulos;
    });
  }

  getPlanta(plantaId: string): Observable<PlantaInterface> {
    this.plantaDoc = this.afs.doc<PlantaInterface>("plantas/" + plantaId);

    return (this.planta = this.plantaDoc.snapshotChanges().pipe(
      map(action => {
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
      map(actions =>
        actions.map(a => {
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

    this.afs
      .collection("plantas")
      .doc(plantaId)
      .collection("userAreas")
      .doc(id)
      .set(userArea);

    return userArea;
  }
  updateUserArea(userArea: UserAreaInterface) {
    const userAreaDoc = this.afs.doc(
      `plantas/${userArea.plantaId}/userAreas/${userArea.id}`
    );
    userAreaDoc.update(userArea);
  }

  getAllUserAreas(plantaId: string): Observable<UserAreaInterface[]> {
    const query$ = this.afs
      .collection("plantas")
      .doc(plantaId)
      .collection("userAreas");

    const result = query$.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
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
      map(user => {
        return user.uid;
      }),
      switchMap(userId => {
        return this.afs
          .collection<UserAreaInterface>(
            `plantas/${plantaId}/userAreas/`,
            ref => ref.where("userId", "==", userId)
          )
          .valueChanges();
      })
    );
  }

  delUserArea(userArea: UserAreaInterface) {
    this.afs
      .collection("plantas")
      .doc(userArea.plantaId)
      .collection("userAreas")
      .doc(userArea.id)
      .delete();
  }

  addLocationArea(plantaId: string, locationArea: LocationAreaInterface) {
    const id = this.afs.createId();
    locationArea.id = id;

    this.afs
      .collection("plantas")
      .doc(plantaId)
      .collection("locationAreas")
      .doc(id)
      .set(locationArea);

    return locationArea;
  }

  updateLocationArea(locArea: LocationAreaInterface) {
    const LocAreaDoc = this.afs.doc(
      `plantas/${locArea.plantaId}/locationAreas/${locArea.id}`
    );
    if (!locArea.hasOwnProperty("modulo")) {
      LocAreaDoc.update({
        modulo: firebase.firestore.FieldValue.delete()
      });
    }
    LocAreaDoc.update(locArea);
  }

  delLocationArea(locationArea: LocationAreaInterface) {
    this.afs
      .collection("plantas")
      .doc(locationArea.plantaId)
      .collection("locationAreas")
      .doc(locationArea.id)
      .delete();
  }

  getLocationsArea(plantaId: string): Observable<LocationAreaInterface[]> {
    const query$ = this.afs
      .collection("plantas")
      .doc(plantaId)
      .collection("locationAreas");

    const result = query$.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
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
      query$ = this.afs.collection<PlantaInterface>("plantas");
      return query$.snapshotChanges().pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as PlantaInterface;
            data.id = a.payload.doc.id;
            return data;
          })
        ),
        map(plantas => {
          return plantas.filter(planta => {
            return user.plantas.includes(planta.id);
          });
        })
      );
    } else if (user.role === 1) {
      query$ = this.afs.collection<PlantaInterface>("plantas");
    } else {
      query$ = this.afs.collection<PlantaInterface>("plantas", ref =>
        ref.where("empresa", "==", user.uid)
      );
    }

    return query$.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as PlantaInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getModulosPlanta(planta: PlantaInterface): ModuloInterface[] {
    if (planta.hasOwnProperty("modulos")) {
      if (planta.modulos.length > 0) {
        return this.modulos.filter(item => {
          return planta.modulos.indexOf(item.id) >= 0;
        });
      }
    }
    return this.modulos;
  }

  getModulos(): Observable<ModuloInterface[]> {
    let query$: AngularFirestoreCollection<ModuloInterface>;

    query$ = this.afs.collection<ModuloInterface>("modulos");

    return query$.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as ModuloInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getNumeroModulo(planta: PlantaInterface, pc: PcInterface): string {
    if (planta.hasOwnProperty("etiquetasLocalXY")) {
      if (planta.etiquetasLocalXY[pc.local_y] !== undefined) {
        if (planta.etiquetasLocalXY[pc.local_y][pc.local_x - 1] !== undefined)
          return planta.etiquetasLocalXY[pc.local_y][pc.local_x - 1];
      }
    }
    return this.getEtiquetaLocalY(planta, pc)
      .toString()
      .concat("/")
      .concat(this.getEtiquetaLocalX(planta, pc).toString());
  }

  getAltura(planta: PlantaInterface, local_y: number) {
    // Por defecto, la altura alta es la numero 1
    if (planta.alturaBajaPrimero) {
      return planta.filas - (local_y - 1);
    } else {
      return local_y;
    }
  }

  getEtiquetaLocalX(planta: PlantaInterface, pc: PcInterface) {
    if (pc.local_x <= 0) {
      return GLOBAL.stringParaDesconocido;
    }
    if (this.planta.hasOwnProperty("etiquetasLocalX")) {
      const localX =
        pc.local_x > planta.etiquetasLocalX.length
          ? planta.etiquetasLocalX.length
          : pc.local_x;
      return planta.etiquetasLocalX[localX - 1];
    }
    return pc.local_x;
  }
  getEtiquetaLocalY(planta: PlantaInterface, pc: PcInterface) {
    if (pc.local_y <= 0) {
      return GLOBAL.stringParaDesconocido;
    }
    if (planta.hasOwnProperty("etiquetasLocalY")) {
      const localY =
        pc.local_y > planta.etiquetasLocalY.length
          ? planta.etiquetasLocalY.length
          : pc.local_y;
      if (planta.alturaBajaPrimero) {
        return planta.etiquetasLocalY[localY - 1];
      }
      return planta.etiquetasLocalY[planta.etiquetasLocalY.length - localY];
    }
    return this.getAltura(planta, pc.local_y);
  }

  getNombreSeguidor(pc: PcInterface) {
    let nombreSeguidor = "";
    if (pc.hasOwnProperty("global_x")) {
      if (!Number.isNaN(pc.global_x)) {
        nombreSeguidor = nombreSeguidor.concat(pc.global_x.toString());
      }
    }
    if (pc.hasOwnProperty("global_y")) {
      if (!Number.isNaN(pc.global_y)) {
        nombreSeguidor = nombreSeguidor.concat(pc.global_y.toString());
      }
    }
    return nombreSeguidor;
  }

  getReferenciaSolardrone(planta: PlantaInterface) {
    return (
      !planta.hasOwnProperty("referenciaSolardrone") ||
      planta.referenciaSolardrone
    );
  }

  getCriterio(criterioId: string): Observable<CriteriosClasificacion> {
    const criterioDoc = this.afs.doc<CriteriosClasificacion>(
      "criteriosClasificacion/" + criterioId
    );

    return criterioDoc.snapshotChanges().pipe(
      map(action => {
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

    query$ = this.afs.collection<CriteriosClasificacion>(
      "criteriosClasificacion"
    );

    return query$.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as CriteriosClasificacion;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }
}
