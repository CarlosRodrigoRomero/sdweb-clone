import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import { Observable, combineLatest, BehaviorSubject, iif, of } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';

import { InformeService } from './informe.service';
import { GLOBAL } from './global';
import { PlantaService } from '@core/services/planta.service';
import { AdminService } from '@core/services/admin.service';

import { Anomalia } from '@core/models/anomalia';
import { CritCoA } from '@core/models/critCoA';
import { CritCriticidad } from '@core/models/critCriticidad';
import { PcInterface } from '@core/models/pc';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaService {
  private _selectedInformeId: string;
  public allAnomaliasInforme: Anomalia[];
  public criterioCoA: CritCoA = GLOBAL.criterioCoA;
  public criterioCriticidad: CritCriticidad;
  private _hasCriticidad = false;
  public hasCriticidad$ = new BehaviorSubject<boolean>(this._hasCriticidad);

  constructor(
    public afs: AngularFirestore,
    private storage: AngularFireStorage,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private adminService: AdminService
  ) {}

  initService(plantaId: string): Promise<void> {
    // obtenemos el criterio de criticidad de la planta si tuviese
    let criterioId: string;
    return new Promise((resolve, reject) => {
      this.plantaService
        .getPlanta(plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            // primero comprovamos si la planta tiene criterio
            if (planta.hasOwnProperty('criterioId')) {
              this.hasCriticidad = true;
              criterioId = planta.criterioId;
            }

            return this.adminService.getUser(planta.empresa);
          }),
          take(1),
          switchMap((user) => {
            // comprobamos primero que exista el usuario
            if (user !== undefined && user !== null) {
              // si la planta no tiene criterio, comprobamos si lo tiene el user
              if (criterioId === undefined || criterioId === null) {
                if (user.hasOwnProperty('criterioId')) {
                  this.hasCriticidad = true;
                  criterioId = user.criterioId;
                }
              }
            } else {
              // aviso para que se cree el usuario que falta
              console.log('Falta usuario en la DB');
            }

            if (criterioId === undefined || criterioId === null) {
              // si el cliente no tiene criterio propio asignamos el criterio por defecto Solardrone5
              criterioId = 'aU2iM5nM0S3vMZxMZGff';
            }

            return this.plantaService.getCriterioCriticidad(criterioId);
          })
        )
        .subscribe((criterio: CritCriticidad) => {
          if (criterio.labels !== undefined) {
            this.criterioCriticidad = criterio;
          }

          // servicio iniciado
          resolve();
        });
    });
  }

  set selectedInformeId(informeId: string) {
    this._selectedInformeId = informeId;
    /* this.getAnomalias$(informeId)
      .pipe(take(1))
      .subscribe((anoms) => {
        this.allAnomaliasInforme = anoms;
      }); */
  }

  get selectedInformeId(): string {
    return this._selectedInformeId;
  }

  async addAnomalia(anomalia: Anomalia) {
    if (anomalia.id === undefined) {
      const id = this.afs.createId();
      anomalia.id = id;
    }

    // Para que Firestore admita "featureCoords", lo transformamos en un objeto
    const anomaliaObj = this._prepararParaDb(anomalia);
    return this.afs.collection('anomalias').doc(anomalia.id).set(anomaliaObj);
  }

  getAnomalia(anomaliaId: string): Observable<Anomalia> {
    const anomRef = this.afs.collection('anomalias').doc(anomaliaId);

    return anomRef.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists) {
          const anomalia = action.payload.data() as Anomalia;
          anomalia.id = action.payload.id;
          return anomalia;
        } else {
          return null;
        }
      })
    );
  }

  getAnomaliasPlanta$(plantaId: string): Observable<Anomalia[]> {
    const query$ = this.informeService.getInformesDePlanta(plantaId).pipe(
      take(1),
      switchMap((informes) => {
        const anomaliaObsList = Array<Observable<Anomalia[]>>();
        informes.forEach((informe) => {
          // traemos ambos tipos de anomalias por si hay pcs antiguos
          anomaliaObsList.push(this.getAnomalias$(informe.id, 'pcs'));
          anomaliaObsList.push(this.getAnomalias$(informe.id, 'anomalias'));
        });
        return combineLatest(anomaliaObsList);
      }),
      map((arr) => arr.flat())
    );

    return query$;
  }

  getAnomaliasInforme$(informeId: string): Observable<Anomalia[]> {
    const anomaliaObsList = Array<Observable<Anomalia[]>>();

    // traemos ambos tipos de anomalias por si hay pcs antiguos
    anomaliaObsList.push(this.getAnomalias$(informeId, 'pcs'));
    anomaliaObsList.push(this.getAnomalias$(informeId, 'anomalias'));

    return combineLatest(anomaliaObsList).pipe(map((arr) => arr.flat()));
  }

  getAnomalias$(informeId: string, tipo?: 'anomalias' | 'pcs'): Observable<Anomalia[]> {
    const query$ = this.afs
      .collection<Anomalia>(tipo, (ref) => ref.where('informeId', '==', informeId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data() as Anomalia;
            data.id = doc.payload.doc.id;
            data.perdidas = this.getPerdidas(data); // cambiamos el valor de la DB por uno basado en el tipo
            data.clase = this.getCoA(data); // cambiamos el valor de la DB por uno basado en el tipo
            data.criticidad = this.getCriticidad(data);
            if (data.globalCoords !== undefined && data.globalCoords !== null) {
              data.globalCoords = Object.values(data.globalCoords); // pasamos los objetos a array
            }

            if (tipo === 'pcs') {
              data.localId = (data as PcInterface).local_id.toString();
              data.localX = (data as PcInterface).local_x;
              data.localY = (data as PcInterface).local_y;
              if (data.globalCoords === undefined) {
                data.globalCoords = [
                  (data as PcInterface).global_x,
                  (data as PcInterface).global_y,
                  (data as PcInterface).global_z,
                ];
              }
            }
            // Convertimos el objeto en un array
            if (data.hasOwnProperty('featureCoords')) {
              data.featureCoords = Object.values(data.featureCoords);
            }

            return data;
          })
        )
      );

    return query$;
  }

  async updateAnomalia(anomalia: Anomalia) {
    const anomaliaObj = this._prepararParaDb(anomalia);
    const anomaliaDoc = this.afs.doc('anomalias/' + anomalia.id);
    return anomaliaDoc.set(anomaliaObj);
  }

  // // PARA CAMBIAR DATOS QUE SE QUEDARON ATRÁS
  updateAnomaliaField(anomalia: Anomalia) {
    this.afs
      .collection('anomalias')
      .doc(anomalia.id)
      .update({
        globalCoords: anomalia.globalCoords,
        // modulo: anomalia.modulo,
      })
      .then(() => {
        console.log('Document successfully updated!');
      });
  }

  private _prepararParaDb(anomalia: Anomalia) {
    anomalia.featureCoords = { ...anomalia.featureCoords };
    anomalia.globalCoords = { ...anomalia.globalCoords };
    const tipo: any = anomalia.tipo;
    anomalia.tipo = parseInt(tipo);
    return Object.assign({}, anomalia);
  }

  // getTempMaxAll(): number {
  // const tMax = Math.max(
  //   ...this.allAnomalias.map((pc) => {
  //     return pc.temperaturaMax as number;
  //   })
  // );
  // return Math.ceil(tMax);
  // }

  async deleteAnomalia(anomalia: Anomalia) {
    return this.afs.doc('anomalias/' + anomalia.id).delete();
  }

  private getPerdidas(anomalia: Anomalia): number {
    return GLOBAL.pcPerdidas[anomalia.tipo];
  }

  private getCoA(anomalia: Anomalia): number {
    let clase = 0;
    // Los que siempre son CoA 3, tengan la temperatura que tengan
    if (this.criterioCoA.siempreCoA3.includes(anomalia.tipo)) {
      clase = 3;
    }

    // El resto
    // Si superan tempCoA3
    if (anomalia.temperaturaMax >= this.criterioCoA.tempCoA3) {
      clase = 3;
    }

    // Si no la supera, la clasificamos según su gradiente
    if (anomalia.gradienteNormalizado >= this.criterioCoA.rangosDT[2]) {
      clase = 3;
    } else {
      if (this.criterioCoA.siempreCoA2.includes(anomalia.tipo)) {
        clase = 2;
      }
      if (anomalia.gradienteNormalizado >= this.criterioCoA.rangosDT[1]) {
        clase = 2;
      } else if (anomalia.gradienteNormalizado >= this.criterioCoA.rangosDT[0]) {
        clase = 1;
      }
    }

    if (this.criterioCoA.siempreVisible.includes(anomalia.tipo)) {
      clase = 1;
    }

    if (clase === 0) {
      clase = 1;
    }

    return clase;
  }

  private getCriticidad(anomalia: Anomalia): number {
    // si hay criterio y no cumple ninguno devolvemos null
    let criticidad = null;
    if (this.criterioCriticidad !== undefined) {
      if (this.criterioCriticidad.hasOwnProperty('criterioConstante')) {
        const criterioConstante = Object.values(this.criterioCriticidad.criterioConstante);
        criterioConstante.forEach((value, index) => {
          if (value.includes(anomalia.tipo)) {
            criticidad = index;
          }
        });
      }
      if (this.criterioCriticidad.hasOwnProperty('siempreVisible')) {
        if (this.criterioCriticidad.siempreVisible.includes(anomalia.tipo)) {
          if (criticidad === null) {
            criticidad = 0;
          }
        }
      }
      if (this.criterioCriticidad.hasOwnProperty('rangosDT')) {
        this.criterioCriticidad.rangosDT.forEach((value, index) => {
          if (anomalia.gradienteNormalizado >= value) {
            if (criticidad === null) {
              criticidad = index;
            }
          }
        });
      }
    } else {
      // si no hay criterio devolvemos undefined
      criticidad = undefined;
    }

    return criticidad;
  }

  downloadRjpg(anomalia: Anomalia) {
    this.storage
      // .ref(`informes/${anomalia.informeId}/rjpg/${anomalia.archivoPublico}`)
      .ref(`informes/${anomalia.informeId}/rjpg/informes_qfqeerbHSTROqL8O2TVk_jpg_200803_Arguedas_1.1.jpg`) // DEMO
      .getDownloadURL()
      .subscribe((downloadUrl) => {
        (anomalia as PcInterface).downloadUrlStringRjpg = downloadUrl;
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          /* Create a new Blob object using the response
           *  data of the onload object.
           */
          const blob = new Blob([xhr.response], { type: 'image/jpg' });
          const a: any = document.createElement('a');
          a.style = 'display: none';
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = `radiometrico_${anomalia.archivoPublico}`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open('GET', downloadUrl);
        xhr.send();
      });
  }

  downloadJpgVisual(anomalia: Anomalia) {
    this.storage
      // .ref(`informes/${anomalia.informeId}/jpgVisual/${anomalia.archivoPublico}`)
      .ref(`informes/${anomalia.informeId}/jpgVisual/informes_qfqeerbHSTROqL8O2TVk_jpgVisual_200803_Arguedas_1.1.jpg`) // DEMO
      .getDownloadURL()
      .subscribe((downloadUrl) => {
        (anomalia as PcInterface).downloadUrlStringVisual = downloadUrl;
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          /* Create a new Blob object using the response
           *  data of the onload object.
           */
          const blob = new Blob([xhr.response], { type: 'image/jpg' });
          const a: any = document.createElement('a');
          a.style = 'display: none';
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = `visual_${anomalia.archivoPublico}`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open('GET', downloadUrl);
        xhr.send();
      });
  }

  get hasCriticidad() {
    return this._hasCriticidad;
  }

  set hasCriticidad(value: boolean) {
    this._hasCriticidad = value;
    this.hasCriticidad$.next(value);
  }
}
