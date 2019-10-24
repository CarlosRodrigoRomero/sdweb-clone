import { Injectable } from "@angular/core";
import { PcInterface } from "../models/pc";
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Observable, BehaviorSubject } from "rxjs";
import { map, take, switchMap, filter } from "rxjs/operators";
import { GLOBAL } from "./global";
import { PlantaService } from "./planta.service";
import { AuthService } from "./auth.service";
import { UserAreaInterface } from "../models/userArea";
import { CriteriosClasificacion } from "../models/criteriosClasificacion";
import { CritCoA } from "../models/critCoA";

export interface SeguidorInterface {
  pcs: PcInterface[];
  global_x?: number;
  global_y?: number;
  nombre?: string;
}

@Injectable({
  providedIn: "root"
})
export class PcService {
  private pcsCollection: AngularFirestoreCollection<PcInterface>;
  public allPcs$: Observable<PcInterface[]>;
  public allPcs: PcInterface[];
  private pcDoc: AngularFirestoreDocument<PcInterface>;
  public url: string;

  private filtroClase = new BehaviorSubject<number[]>(new Array<number>());
  public filtroClase$ = this.filtroClase.asObservable();
  private filtroCategoria = new BehaviorSubject<number[]>(new Array<number>());
  public filtroCategoria$ = this.filtroCategoria.asObservable();
  private filtroGradiente = new BehaviorSubject<number>(
    GLOBAL.filtroGradientePorDefecto
  );
  public filtroGradiente$ = this.filtroGradiente.asObservable();

  private currentFiltroClase: number[];
  private currentFiltroCategoria: number[];
  public currentFiltroGradiente: number;

  private filteredPcsSource = new BehaviorSubject<PcInterface[]>(
    new Array<PcInterface>()
  );
  public currentFilteredPcs$ = this.filteredPcsSource.asObservable();

  private filteredSeguidores = new BehaviorSubject<SeguidorInterface[]>(
    new Array<SeguidorInterface>()
  );
  public filteredSeguidores$ = this.filteredSeguidores.asObservable();

  constructor(
    public afs: AngularFirestore,
    public plantaService: PlantaService,
    public auth: AuthService
  ) {
    this.pcsCollection = afs.collection<PcInterface>("pcs");

    this.filtroCategoria.next(
      Array(GLOBAL.labels_tipos.length)
        .fill(0)
        .map((_, i) => i + 1)
    );

    this.filtroClase.next(
      Array(GLOBAL.labels_severidad.length)
        .fill(0)
        .map((_, i) => i + 1)
    );

    this.filtroClase$.subscribe(filtro => {
      this.currentFiltroClase = filtro;
    });

    this.filtroCategoria$.subscribe(filtro => {
      this.currentFiltroCategoria = filtro;
    });

    this.filtroGradiente$.subscribe(filtro => {
      this.currentFiltroGradiente = filtro;
    });
    // console.log('filtrosCategorias', this.filtroCategoria, this.filtroClase);
    // this.currentFilteredPcs$ = this.filtroCategoria$
    //   .mergeMap( filtro1 => this.filtroClase$
    //     .mergeMap( filtro2 => this.allPcs$
    //       .mergeMap( allPcs => allPcs.filter( (pc) => {
    //         return filtro2.includes(pc.tipo) && filtro1.includes(this.getPcCoA(pc));
    //       }))));
  }

  private aplicarFiltros() {
    this.filteredPcsSource.next(
      this.allPcs
        .filter(
          pc =>
            this.currentFiltroClase.includes(this.getPcCoA(pc)) &&
            this.currentFiltroCategoria.includes(pc.tipo) &&
            (pc.gradienteNormalizado >= this.currentFiltroGradiente ||
              (pc.gradienteNormalizado < this.currentFiltroGradiente &&
                pc.tipo !== 8 &&
                pc.tipo !== 9))
        )
        .sort(this.sortByLocalId)
    );

    this.filteredSeguidores.next(
      this.getPcsPorSeguidor(
        this.allPcs
          .filter(
            pc =>
              this.currentFiltroClase.includes(this.getPcCoA(pc)) &&
              this.currentFiltroCategoria.includes(pc.tipo) &&
              (pc.gradienteNormalizado >= this.currentFiltroGradiente ||
                (pc.gradienteNormalizado < this.currentFiltroGradiente &&
                  pc.tipo !== 8 &&
                  pc.tipo !== 9))
          )
          .sort(this.sortByLocalId)
      )
    );
  }

  PushFiltroClase(filtro: number[]): void {
    this.filtroClase.next(filtro);
    // this.currentFiltroClase = filtro;
    this.aplicarFiltros();
  }

  PushFiltroCategoria(filtro: number[]): void {
    this.filtroCategoria.next(filtro);
    // this.currentFiltroCategoria = filtro;
    this.aplicarFiltros();
  }

  PushFiltroGradiente(filtro: number) {
    this.filtroGradiente.next(filtro);
    // this.currentFiltroCategoria = filtro;
    this.aplicarFiltros();
  }

  getPcsPorSeguidor(
    allPcsConSeguidores: PcInterface[]
  ): Array<SeguidorInterface> {
    const arraySeguidores = Array<SeguidorInterface>();
    allPcsConSeguidores.sort(this.sortByLocalId);

    let oldNombreSeguidor = "981768";
    for (const pc of allPcsConSeguidores) {
      const nombreSeguidor = this.plantaService.getNombreSeguidor(pc);
      if (nombreSeguidor !== oldNombreSeguidor) {
        oldNombreSeguidor = nombreSeguidor;

        const data = {
          pcs: allPcsConSeguidores.filter(element => {
            return (
              this.plantaService.getNombreSeguidor(element) === nombreSeguidor
            );
          }),
          global_x: pc.global_x,
          global_y: pc.global_y,
          nombre: nombreSeguidor
        } as SeguidorInterface;
        arraySeguidores.push(data);
      }
    }
    return arraySeguidores;
  }

  getSeguidoresSinPcs(informeId: string): Observable<PcInterface[]> {
    const query$ = this.afs.collection<PcInterface>("pcs", ref =>
      ref.where("informeId", "==", informeId).where("tipo", "==", 0)
    );

    return query$.valueChanges();
  }

  getPcsSinFiltros(informeId: string): Observable<PcInterface[]> {
    const query$ = this.afs
      .collection<PcInterface>("pcs", ref =>
        ref.where("informeId", "==", informeId)
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(doc => {
            const data = doc.payload.doc.data() as PcInterface;
            data.id = doc.payload.doc.id;
            return data;
          })
        )
      );

    return query$;
  }

  getPcs(informeId: string, plantaId: string): Observable<PcInterface[]> {
    const query$ = this.afs
      .collection<PcInterface>("pcs", ref =>
        ref.where("informeId", "==", informeId)
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions
            .map(doc => {
              const data = doc.payload.doc.data() as PcInterface;
              data.id = doc.payload.doc.id;
              return data;
            })
            .filter(pc => {
              if (pc.hasOwnProperty("clase")) {
                return pc.clase > 0;
              }
              return (
                pc.gradienteNormalizado >= GLOBAL.minGradiente ||
                (pc.gradienteNormalizado < GLOBAL.minGradiente &&
                  pc.tipo !== 8 &&
                  pc.tipo !== 9)
              );
            })
        )
      );

    this.allPcs$ = this.auth.user$.pipe(
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
      }),
      switchMap(userAreas => {
        return query$.pipe(
          map(pcs => {
            if (userAreas.length > 0) {
              return pcs.filter(pc => {
                for (let i = 0; i < userAreas.length; i++) {
                  if (
                    this.containsLatLng(
                      [pc.gps_lat, pc.gps_lng],
                      userAreas[i].path
                    )
                  ) {
                    return true;
                  }
                }
                return false;
              });
            } else {
              return pcs;
            }
          })
        );
      })
    );

    this.allPcs$.pipe(take(1)).subscribe(pcs => {
      this.allPcs = pcs;
      this.filteredPcsSource.next(this.allPcs.sort(this.sortByLocalId));
      // Aplicar filtros
      this.aplicarFiltros();
    });
    return this.allPcs$;
  }

  getPcsInformeEdit(informeId: string): Observable<PcInterface[]> {
    const query$ = this.afs.collection<PcInterface>("pcs", ref =>
      ref.where("informeId", "==", informeId)
    );
    this.allPcs$ = query$.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as PcInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );

    return this.allPcs$;
  }

  getPc(id: string) {
    this.pcDoc = this.afs.doc<PcInterface>("pcs/" + id);

    return this.pcDoc.snapshotChanges().pipe(
      map(action => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as PcInterface;
          data.id = action.payload.id;
          return data;
        }
      })
    );
  }

  addPc(pc: PcInterface) {
    const id = this.afs.createId();
    pc.id = id;
    this.pcsCollection.doc(id).set(pc);
  }

  updatePc(pc: PcInterface) {
    this.pcDoc = this.afs.doc("pcs/" + pc.id);
    this.pcDoc.update(pc);
  }

  delPc(pc: PcInterface) {
    this.pcDoc = this.afs.doc("pcs/" + pc.id);
    this.pcDoc.delete();
  }

  private sortByLocalId(a: PcInterface, b: PcInterface) {
    if (a.local_id < b.local_id) {
      return -1;
    }
    if (a.local_id > b.local_id) {
      return 1;
    }
    return 0;
  }

  containsLatLng(point, polygonPath) {
    const vs = polygonPath;

    const x = point[0];
    const y = point[1];

    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i].lat,
        yi = vs[i].lng;
      var xj = vs[j].lat,
        yj = vs[j].lng;

      var intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  getCoA(pc: PcInterface, critCoA: CritCoA): number {
    // Los que siempre son CoA 3, tengan la temperatura que tengan
    if (critCoA.hasOwnProperty("siempreCoA3")) {
      if (critCoA.siempreCoA3.includes(pc.tipo)) {
        return 3;
      }
    }

    // El resto
    // Si superan tempCoA3
    if (critCoA.hasOwnProperty("tempCoA3")) {
      if (pc.temperaturaMax >= critCoA.tempCoA3) {
        return 3;
      }
    }

    // Si no la supera, la clasificamos según su gradiente
    if (pc.gradienteNormalizado >= critCoA.rangosDT[2]) {
      return 3;
    } else {
      if (critCoA.hasOwnProperty("siempreCoA2")) {
        if (critCoA.siempreCoA2.includes(pc.tipo)) {
          return 2;
        }
      }
      if (pc.gradienteNormalizado >= critCoA.rangosDT[1]) {
        return 2;
      } else if (pc.gradienteNormalizado >= critCoA.rangosDT[0]) {
        return 1;
      }
    }

    if (critCoA.hasOwnProperty("siempreVisible")) {
      if (critCoA.siempreVisible.includes(pc.tipo)) {
        return 1;
      }
    }

    return 0;
  }

  getPcCoA(pc): number {
    if (pc.hasOwnProperty("clase")) {
      return pc.clase;
    }
    return pc.severidad;
  }
}
