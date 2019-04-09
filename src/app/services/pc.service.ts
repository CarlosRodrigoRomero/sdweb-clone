import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {PcInterface} from '../models/pc';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, CollectionReference } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, take } from 'rxjs/operators';

export interface SeguidorInterface {
  pcs: PcInterface[];
  global_x: number;
}


@Injectable({
  providedIn: 'root'
})
export class PcService {
  private pcsCollection: AngularFirestoreCollection<PcInterface>;
  public allPcs$: Observable<PcInterface[]>;
  public allPcs: PcInterface[];
  private pcDoc: AngularFirestoreDocument<PcInterface>;
  public url: string;
  private filteredPcsSource = new BehaviorSubject<PcInterface[]>(new Array<PcInterface>());
  public currentFilteredPcs$ = this.filteredPcsSource.asObservable();

  constructor(public afs: AngularFirestore, private http: HttpClient) {
    this.pcsCollection = afs.collection<PcInterface>('pcs');


  }

  filteredPcs(pcs: PcInterface[]) {
    this.filteredPcsSource.next(pcs);
  }

  getPcsPorSeguidor(allPcsConSeguidores: PcInterface[]): Array<SeguidorInterface> {
    const arraySeguidores = Array();
    allPcsConSeguidores.sort(this.compare);

    let oldGlobalX = 981768;
    for (const pc of allPcsConSeguidores) {
      if ( pc.global_x !== oldGlobalX ) {
        oldGlobalX = pc.global_x;

        const arrayPcsSeguidor = allPcsConSeguidores.filter(element => element.global_x === pc.global_x);
        const data = {
          pcs: arrayPcsSeguidor,
          global_x: pc.global_x
        }
        arraySeguidores.push(data);
      }
    }
    return arraySeguidores;
  }


  getPcs(informeId: string): Observable<PcInterface[]> {
    const query$ = this.afs.collection<PcInterface>('pcs', ref => ref.where('informeId', '==', informeId));
    this.allPcs$ = query$.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as PcInterface;
        data.id = a.payload.doc.id;
        return data;
        }))
      );
    this.allPcs$
      .pipe(take(1))
      .subscribe( pcs => {
        this.allPcs = pcs;
    });
    return this.allPcs$;
  }

  getPc(id: string) {
    this.pcDoc = this.afs.doc<PcInterface>('pcs/' + id);

    return this.pcDoc.snapshotChanges().pipe(map(action => {
      if (action.payload.exists === false) {
        return null;
      } else {
        const data = action.payload.data() as PcInterface;
        data.id = action.payload.id;
        return data;
      }
    }));
  }

  addPc(pc: PcInterface) {
    const id = this.afs.createId();
    pc.id = id;
    this.pcsCollection.doc(id).set(pc);

  }

  updatePc(pc: PcInterface) {
    this.pcDoc = this.afs.doc('pcs/' + pc.id);
    this.pcDoc.update(pc);
  }

  delPc(pc: PcInterface) {
    this.pcDoc = this.afs.doc('pcs/' + pc.id);
    this.pcDoc.delete();
  }

  private compare(a: PcInterface, b: PcInterface) {
    if (a.global_x < b.global_x) {
      return -1;
    }
    if (a.global_x > b.global_x) {
      return 1;
    }
    return 0;
  }


}
