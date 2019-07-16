import { Injectable } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection
} from "@angular/fire/firestore";
import { PlantaInterface } from "src/app/models/planta";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { LocationAreaInterface } from "../models/location";
import { GLOBAL } from "./global";
import { UserInterface } from "../models/user";
import { ModuloInterface } from '../models/modulo';

@Injectable({
  providedIn: "root"
})
export class PlantaService {
  public itemDoc: AngularFirestoreDocument<PlantaInterface>;
  private plantas: Observable<PlantaInterface[]>;
  public planta: Observable<PlantaInterface>;
  private plantaDoc: AngularFirestoreDocument<PlantaInterface>;
  public plantasCollection: AngularFirestoreCollection<PlantaInterface>;

  constructor(private afs: AngularFirestore) {
    this.plantas = afs.collection("plantas").valueChanges();
  }

  getPlanta(id: string) {
    this.plantaDoc = this.afs.doc<PlantaInterface>("plantas/" + id);

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

  updateLocationArea(locationArea: LocationAreaInterface) {
    const LocAreaDoc = this.afs.doc(
      `plantas/${locationArea.plantaId}/locationAreas/${locationArea.id}`
    );
    LocAreaDoc.update(locationArea);
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
    if (user.role === 1) {
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

  getModulos(plantaId: string): Observable<ModuloInterface[]> {
    let query$: AngularFirestoreCollection<ModuloInterface>;

    // TODO: que devuelva sólo los modulos presentes en dicha planta
    // De momento, va a devolver todos lo modulos que encuentre
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
}
