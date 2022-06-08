import { Injectable } from '@angular/core';
import { PcInterface, Pc } from '@core/models/pc';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';
import { GLOBAL } from '@data/constants/global';
import { PlantaService } from './planta.service';
import { AuthService } from './auth.service';
import { UserAreaInterface } from '@core/models/userArea';
import { CritCoA } from '@core/models/critCoA';
import { stringify } from '@angular/compiler/src/util';

export interface SeguidorInterface {
  pcs: PcInterface[];
  global_x?: number;
  global_y?: number;
  nombre?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PcService {
  private pcsCollection: AngularFirestoreCollection<PcInterface>;
  public allPcsInformeEdit$: Observable<Pc[]>;
  public allPcs$: Observable<PcInterface[]>;
  public allPcs: PcInterface[];
  private pcDoc: AngularFirestoreDocument<PcInterface>;
  public url: string;

  private filtroClase = new BehaviorSubject<number[]>(new Array<number>());
  public filtroClase$ = this.filtroClase.asObservable();
  private filtroCategoria = new BehaviorSubject<number[]>(new Array<number>());
  public filtroCategoria$ = this.filtroCategoria.asObservable();
  private filtroGradiente = new BehaviorSubject<number>(GLOBAL.filtroGradientePorDefecto);
  public filtroGradiente$ = this.filtroGradiente.asObservable();

  private currentFiltroClase: number[];
  private currentFiltroCategoria: number[];
  public currentFiltroGradiente: number;

  private filteredPcsSource = new BehaviorSubject<PcInterface[]>(new Array<PcInterface>());
  public currentFilteredPcs$ = this.filteredPcsSource.asObservable();

  private filteredSeguidores = new BehaviorSubject<SeguidorInterface[]>(new Array<SeguidorInterface>());
  public filteredSeguidores$ = this.filteredSeguidores.asObservable();

  constructor(public afs: AngularFirestore, public plantaService: PlantaService, public auth: AuthService) {
    this.pcsCollection = afs.collection<PcInterface>('pcs');

    this.filtroCategoria.next(
      Array(GLOBAL.labels_tipos.length)
        .fill(0)
        .map((_, i) => i + 1)
    );

    this.filtroClase.next(
      Array(GLOBAL.labels_clase.length)
        .fill(0)
        .map((_, i) => i + 1)
    );

    this.filtroClase$.subscribe((filtro) => {
      this.currentFiltroClase = filtro;
    });

    this.filtroCategoria$.subscribe((filtro) => {
      this.currentFiltroCategoria = filtro;
    });

    this.filtroGradiente$.subscribe((filtro) => {
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
          (pc) =>
            this.currentFiltroClase.includes(this.getPcCoA(pc)) &&
            this.currentFiltroCategoria.includes(pc.tipo) &&
            (pc.gradienteNormalizado >= this.currentFiltroGradiente ||
              (pc.gradienteNormalizado === 10 && (pc.tipo === 11 || pc.tipo === 15)) ||
              (pc.gradienteNormalizado < this.currentFiltroGradiente &&
                pc.tipo !== 8 &&
                pc.tipo !== 9 &&
                pc.tipo !== 11 &&
                pc.tipo !== 15))
        )
        .sort(this.sortByLocalId)
    );

    this.filteredSeguidores.next(
      this.getPcsPorSeguidor(
        this.allPcs
          .filter(
            (pc) =>
              this.currentFiltroClase.includes(this.getPcCoA(pc)) &&
              this.currentFiltroCategoria.includes(pc.tipo) &&
              (pc.gradienteNormalizado >= this.currentFiltroGradiente ||
                (pc.gradienteNormalizado < this.currentFiltroGradiente && pc.tipo !== 8 && pc.tipo !== 9))
          )
          .sort(this.sortByGlobals)
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

  getPcsPorSeguidor(pcList: PcInterface[]): Array<SeguidorInterface> {
    const arraySeguidores = Array<SeguidorInterface>();
    pcList.sort(this.sortByGlobals);

    let oldNombreSeguidor = '981768';
    for (let pc of pcList) {
      pc = this.globalCoordsToClasic(pc);
      const nombreSeguidor = this.plantaService.getNombreSeguidor(pc);
      if (nombreSeguidor !== oldNombreSeguidor) {
        oldNombreSeguidor = nombreSeguidor;

        const data = {
          pcs: pcList.filter((element) => {
            return this.plantaService.getNombreSeguidor(element) === nombreSeguidor;
          }),
          global_x: pc.global_x,
          global_y: pc.global_y,
          nombre: nombreSeguidor,
        } as SeguidorInterface;
        arraySeguidores.push(data);
      }
    }
    return arraySeguidores;
  }

  getSeguidoresSinPcs(informeId: string): Observable<PcInterface[]> {
    const query$ = this.afs.collection<PcInterface>('pcs', (ref) =>
      ref.where('informeId', '==', informeId).where('tipo', '==', 0)
    );

    return query$.valueChanges();
  }

  getPcsSinFiltros(informeId: string): Observable<PcInterface[]> {
    const query$ = this.afs
      .collection<PcInterface>('pcs', (ref) => ref.where('informeId', '==', informeId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            let data = doc.payload.doc.data() as PcInterface;
            data.id = doc.payload.doc.id;
            data = this.globalCoordsToClasic(data);
            return data;
          })
        )
      );

    return query$;
  }

  checkIsCoord(coord: any) {}

  private globalCoordsToClasic(pc: PcInterface): PcInterface {
    if (pc.hasOwnProperty('globalCoords')) {
      pc.globalCoords.forEach((coord, i, array) => {
        if (i === 0) {
          pc.global_x = coord;
        } else if (i === 1) {
          pc.global_y = coord;
        } else if (i === 2) {
          pc.global_z = coord;
        }
        return pc;
      });
    }
    return pc;
  }

  getPcs(informeId: string, plantaId: string): Observable<PcInterface[]> {
    const query$ = this.afs
      .collection<PcInterface>('pcs', (ref) => ref.where('informeId', '==', informeId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions
            .map((doc) => {
              let data = doc.payload.doc.data() as PcInterface;
              data.id = doc.payload.doc.id;
              data = this.globalCoordsToClasic(data);
              return data;
            })
            .filter((pc) => {
              if (pc.hasOwnProperty('clase')) {
                return pc.clase > 0;
              }
              return (
                pc.gradienteNormalizado >= GLOBAL.minGradiente ||
                (pc.gradienteNormalizado < GLOBAL.minGradiente && pc.tipo !== 8 && pc.tipo !== 9)
              );
            })
        )
      );

    this.allPcs$ = this.auth.user$.pipe(
      map((user) => {
        return user.uid;
      }),
      switchMap((userId) => {
        return this.afs
          .collection<UserAreaInterface>(`plantas/${plantaId}/userAreas/`, (ref) => ref.where('userId', '==', userId))
          .valueChanges();
      }),
      switchMap((userAreas) => {
        return query$.pipe(
          map((pcs) => {
            if (userAreas.length > 0) {
              return pcs.filter((pc) => {
                for (let i = 0; i < userAreas.length; i++) {
                  if (this.containsLatLng([pc.gps_lat, pc.gps_lng], userAreas[i].path)) {
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

    this.allPcs$.pipe(take(1)).subscribe((pcs) => {
      this.allPcs = pcs;
      this.filteredPcsSource.next(this.allPcs.sort(this.sortByLocalId));
      // Aplicar filtros
      this.aplicarFiltros();
    });
    return this.allPcs$;
  }

  getPcsInformeEdit(informeId: string): Observable<Pc[]> {
    const query$ = this.afs.collection<PcInterface>('pcs', (ref) => ref.where('informeId', '==', informeId));
    this.allPcsInformeEdit$ = query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          let data = a.payload.doc.data() as PcInterface;
          data.id = a.payload.doc.id;
          data = this.globalCoordsToClasic(data);
          return new Pc(data);
        })
      )
    );

    return this.allPcsInformeEdit$;
  }

  getPc(id: string) {
    this.pcDoc = this.afs.doc<PcInterface>('pcs/' + id);

    return this.pcDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          let data = action.payload.data() as PcInterface;
          data.id = action.payload.id;
          data = this.globalCoordsToClasic(data);

          return data;
        }
      })
    );
  }

  async addPc(pc: PcInterface) {
    const id = this.afs.createId();
    pc.id = id;

    return this.afs.collection('pcs').doc(id).set(pc);
  }

  async updatePc(pc: PcInterface | Pc) {
    const pcObj = Object.assign({}, pc);
    return this.afs.doc('pcs/' + pc.id).update(pcObj);
  }

  async delPc(pc: PcInterface) {
    return this.afs.doc('pcs/' + pc.id).delete();
  }

  sortByLocalId(a: PcInterface, b: PcInterface) {
    if (a.local_id < b.local_id) {
      return -1;
    }
    if (a.local_id > b.local_id) {
      return 1;
    }
    return 0;
  }

  sortByGlobals(a: PcInterface, b: PcInterface): number {
    if (a.global_x < b.global_x) {
      return -1;
    }
    if (a.global_x > b.global_x) {
      return 1;
    }
    // Mismo global_x
    if (a.global_y < b.global_y) {
      return -1;
    }
    if (a.global_y > b.global_y) {
      return 1;
    }

    // Mismo global_x y global_y
    if (a.local_y < b.local_y) {
      return -1;
    }
    if (a.local_y > b.local_y) {
      return 1;
    }
    // Mismo local_y
    if (a.local_x < b.local_x) {
      return -1;
    }
    if (a.local_x > b.local_x) {
      return 1;
    }
    // Mismo local_x y local_y
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

      var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  getCoA(pc: PcInterface, critCoA: CritCoA): number {
    // Los que siempre son CoA 3, tengan la temperatura que tengan
    if (critCoA.hasOwnProperty('siempreCoA3')) {
      if (critCoA.siempreCoA3.includes(pc.tipo)) {
        return 3;
      }
    }

    // El resto
    // Si superan tempCoA3
    if (critCoA.hasOwnProperty('tempCoA3')) {
      if (pc.temperaturaMax >= critCoA.tempCoA3) {
        return 3;
      }
    }

    // Si no la supera, la clasificamos según su gradiente
    if (pc.gradienteNormalizado >= critCoA.rangosDT[2]) {
      return 3;
    } else {
      if (critCoA.hasOwnProperty('siempreCoA2')) {
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

    if (critCoA.hasOwnProperty('siempreVisible')) {
      if (critCoA.siempreVisible.includes(pc.tipo)) {
        return 1;
      }
    }

    return 0;
  }

  getPcCoA(pc): number {
    if (pc.hasOwnProperty('clase')) {
      return pc.clase;
    }
    return pc.severidad;
  }

  set(pcs: PcInterface[]) {
    this.allPcs = pcs;
  }
  get() {
    return this.allPcs;
  }

  getTempMaxAllPcs(): number {
    const tMax = Math.max(
      ...this.allPcs.map((pc) => {
        return pc.temperaturaMax as number;
      })
    );
    return Math.ceil(tMax);
  }

  getMinGradienteNormalizado(): number {
    const min = Math.min(
      ...this.allPcs.map((pc) => {
        return pc.gradienteNormalizado as number;
      })
    );
    return Math.floor(min);
  }

  getMaxGradienteNormalizado(): number {
    const max = Math.max(
      ...this.allPcs.map((pc) => {
        return pc.gradienteNormalizado;
      })
    );
    return Math.ceil(max);
  }

  getLabelsTipoPcs(): string[] {
    const indices: number[] = [];
    const labels: string[] = [];
    this.allPcs.forEach((pc) => {
      if (!indices.includes(pc.tipo)) {
        indices.push(pc.tipo);
      }
    });
    indices.forEach((i) => labels.push(GLOBAL.labels_tipos[i]));
    // los ordena como estan en GLOBAL
    labels.sort((a, b) => GLOBAL.labels_tipos.indexOf(a) - GLOBAL.labels_tipos.indexOf(b));

    return labels;
  }

  getModuloLabelPc(pc: PcInterface): string {
    let moduloLabel: string;
    if (pc.modulo.marca === undefined) {
      if (pc.modulo.modelo === undefined) {
        moduloLabel = pc.modulo.potencia + 'W';
      } else {
        moduloLabel = pc.modulo.modelo + ' ' + pc.modulo.potencia + 'W';
      }
    } else {
      if (pc.modulo.modelo === undefined) {
        moduloLabel = pc.modulo.marca + ' ' + pc.modulo.potencia + 'W';
      } else {
        moduloLabel = pc.modulo.marca + ' ' + pc.modulo.modelo + ' ' + pc.modulo.potencia + 'W';
      }
    }
    return moduloLabel;
  }

  getModulosPcs(): string[] {
    const modulos: string[] = [];

    this.allPcs.forEach((pc) => {
      if (!modulos.includes(this.getModuloLabelPc(pc))) {
        modulos.push(this.getModuloLabelPc(pc));
      }
    });

    return modulos;
  }

  getZonasPcs(): string[] {
    const zonas: string[] = [];
    this.allPcs.forEach((pc) => {
      if (!zonas.includes(pc.global_x)) {
        zonas.push(pc.global_x);
      }
    });
    return zonas.sort();
  }

  getLocalId(pc: PcInterface): string {
    const data = [];
    pc.globalCoords.forEach((gC) => {
      if (gC !== null) {
        data.push(gC);
      }
    });
    data.push(pc.local_x);
    data.push(pc.local_y);

    return data.join('.');
  }
}
