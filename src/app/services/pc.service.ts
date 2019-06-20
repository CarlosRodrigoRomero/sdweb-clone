import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { PcInterface } from "../models/pc";
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { Observable, BehaviorSubject } from "rxjs";
import { map, take } from "rxjs/operators";
import { GLOBAL } from "./global";

export interface SeguidorInterface {
  pcs: PcInterface[];
  global_x: number;
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

  constructor(public afs: AngularFirestore, private http: HttpClient) {
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
    //         return filtro2.includes(pc.tipo) && filtro1.includes(pc.severidad);
    //       }))));
  }

  private aplicarFiltros() {
    this.filteredPcsSource.next(
      this.allPcs
        .filter(
          pc =>
            this.currentFiltroClase.includes(pc.severidad) &&
            this.currentFiltroCategoria.includes(pc.tipo) &&
            (pc.gradienteNormalizado >= this.currentFiltroGradiente ||
              (pc.gradienteNormalizado < this.currentFiltroGradiente &&
                pc.tipo !== 8 &&
                pc.tipo !== 9))
        )
        .sort(this.compare)
    );

    this.filteredSeguidores.next(
      this.getPcsPorSeguidor(
        this.allPcs
          .filter(
            pc =>
              this.currentFiltroClase.includes(pc.severidad) &&
              this.currentFiltroCategoria.includes(pc.tipo) &&
              (pc.gradienteNormalizado >= this.currentFiltroGradiente ||
                (pc.gradienteNormalizado < this.currentFiltroGradiente &&
                  pc.tipo !== 8 &&
                  pc.tipo !== 9))
          )
          .sort(this.compare)
      )
    );
  }

  PushFiltroClase(filtro: number[]) {
    this.filtroClase.next(filtro);
    // this.currentFiltroClase = filtro;
    this.aplicarFiltros();
  }

  PushFiltroCategoria(filtro: number[]) {
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
    const arraySeguidores = Array();
    allPcsConSeguidores.sort(this.compare);

    let oldGlobalX = 981768;
    for (const pc of allPcsConSeguidores) {
      if (pc.global_x !== oldGlobalX) {
        oldGlobalX = pc.global_x;

        const data = {
          pcs: allPcsConSeguidores.filter(
            element => element.global_x === pc.global_x
          ),
          global_x: pc.global_x
        };
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

  getPcs(informeId: string): Observable<PcInterface[]> {
    const query$ = this.afs.collection<PcInterface>("pcs", ref =>
      ref.where("informeId", "==", informeId)
    );
    this.allPcs$ = query$.snapshotChanges().pipe(
      map(actions =>
        actions
          .map(a => {
            const data = a.payload.doc.data() as PcInterface;
            data.id = a.payload.doc.id;
            return data;
          })
          .filter(
            pc =>
              pc.gradienteNormalizado >= GLOBAL.minGradiente ||
              (pc.gradienteNormalizado < GLOBAL.minGradiente &&
                pc.tipo !== 8 &&
                pc.tipo !== 9)
          )
      )
    );

    this.allPcs$.pipe(take(1)).subscribe(pcs => {
      this.allPcs = pcs;
      this.filteredPcsSource.next(this.allPcs.sort(this.compare));
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

  private compare(a: PcInterface, b: PcInterface) {
    if (a.local_id < b.local_id) {
      return -1;
    }
    if (a.local_id > b.local_id) {
      return 1;
    }
    return 0;
  }
}
