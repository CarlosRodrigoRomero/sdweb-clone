import { Injectable } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection
} from "@angular/fire/firestore";
import { PlantaInterface } from "src/app/models/planta";
import { Observable, BehaviorSubject } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { LocationAreaInterface } from "../models/location";
import { GLOBAL } from "./global";
import { UserInterface } from "../models/user";
import { ModuloInterface } from "../models/modulo";

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

  constructor(private afs: AngularFirestore) {
    // this.plantas = afs.collection("plantas").valueChanges();
    this.getModulos().subscribe(modulos => {
      this.modulos = modulos;
    });
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

  updatePlanta(planta: PlantaInterface) {
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

  getModulosPlanta(planta: PlantaInterface): ModuloInterface[] {
    if (planta.hasOwnProperty('modulos')) {
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
}
