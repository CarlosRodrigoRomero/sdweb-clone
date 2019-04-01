import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {PcInterface} from '../models/pc';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, CollectionReference } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class PcService {
  private pcsCollection: AngularFirestoreCollection<PcInterface>;
  private pcs: Observable<PcInterface[]>;
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

  getSeguidores(informeId: string) {
    
  }


  getPcs(informeId: string) {
    const query$ = this.afs.collection<PcInterface>('pcs', ref => ref.where('informeId', '==', informeId));
    return query$.snapshotChanges().pipe(
      map(actions => actions.map(a => {
    const data = a.payload.doc.data() as PcInterface;
    data.id = a.payload.doc.id;
    return data;
  }))
);
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


}
