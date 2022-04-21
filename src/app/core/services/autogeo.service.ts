import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Coordinate } from 'ol/coordinate';

export interface Mesa {
  id: string;
  coords: Coordinate[];
}

@Injectable({
  providedIn: 'root',
})
export class AutogeoService {
  constructor(private afs: AngularFirestore) {}

  getMesas(informeId: string): Observable<Mesa[]> {
    const query$ = this.afs
      .collection<Mesa>('autogeo/' + informeId + '/mesas')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            console.log('ok');
            const data = doc.payload.doc.data();
            data.id = doc.payload.doc.id;

            // Convertimos el objeto en un array
            data.coords = this.coordsDbToArray((data as any).tl, (data as any).tr, (data as any).br, (data as any).bl);

            return data;
          })
        )
      );
    return query$;
  }

  private coordsDbToArray(tl: any, tr: any, br: any, bl: any): Coordinate[] {
    const topLeft = Object.values(tl) as Coordinate;
    const topRight = Object.values(tr) as Coordinate;
    const bottomRight = Object.values(br) as Coordinate;
    const bottomLeft = Object.values(bl) as Coordinate;

    return [topLeft, topRight, bottomRight, bottomLeft];
  }
}
