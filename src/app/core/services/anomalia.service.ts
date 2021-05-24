import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import { Observable, combineLatest, BehaviorSubject, EMPTY } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';

import { InformeService } from './informe.service';
import { GLOBAL } from './global';
import { PlantaService } from '@core/services/planta.service';

import { Anomalia } from '@core/models/anomalia';
import { CritCoA } from '@core/models/critCoA';
import { CritCriticidad } from '@core/models/critCriticidad';
import { CriteriosClasificacion } from '../models/criteriosClasificacion';
import { PcInterface } from '@core/models/pc';

@Injectable({
  providedIn: 'root',
})
export class AnomaliaService {
  private _selectedInformeId: string;
  public allAnomaliasInforme: Anomalia[];
  public criterioCoA: CritCoA;
  public criterioCriticidad: CritCriticidad;
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);

  constructor(
    public afs: AngularFirestore,
    private storage: AngularFireStorage,
    private informeService: InformeService,
    private plantaService: PlantaService
  ) {}

  initService(plantaId: string) {
    // obtenemos el criterio de CoA de la planta
    this.plantaService
      .getPlanta(plantaId)
      .pipe(
        take(1),
        switchMap((planta) => {
          if (planta.hasOwnProperty('criterioId')) {
            return this.plantaService.getCriterio(planta.criterioId);
          } else {
            // return this.plantaService.getCriterio('aU2iM5nM0S3vMZxMZGff');  // DEMO
            return this.plantaService.getCriterio(GLOBAL.criterioSolardroneId);
          }
        })
      )
      .subscribe((criterios: CriteriosClasificacion) => {
        this.criterioCoA = criterios.critCoA;
        this.criterioCriticidad = criterios.critCriticidad;
        this.inicialized = true;
      });

    return this.initialized$;
  }

  set selectedInformeId(informeId: string) {
    this._selectedInformeId = informeId;
    this.getAnomalias$(informeId)
      .pipe(take(1))
      .subscribe((anoms) => {
        this.allAnomaliasInforme = anoms;
      });
  }

  get selectedInformeId(): string {
    return this._selectedInformeId;
  }

  async addAnomalia(anomalia: Anomalia) {
    const id = this.afs.createId();
    anomalia.id = id;
    // Para que Firestore admita "featureCoords", lo transformamos en un objeto
    const anomaliaObj = this._prepararParaDb(anomalia);
    return this.afs.collection('anomalias').doc(id).set(anomaliaObj);
  }

  getAnomaliasPlanta$(plantaId: string): Observable<Anomalia[]> {
    const query$ = this.informeService.getInformesDePlanta(plantaId).pipe(
      take(1),
      switchMap((informes) => {
        const anomaliaObsList = Array<Observable<Anomalia[]>>();
        informes.forEach((informe) => {
          anomaliaObsList.push(this.getAnomalias$(informe.id /* , 'pcs' */ /* para la demo */));
        });
        return combineLatest(anomaliaObsList);
      }),
      map((arr) => {
        return arr.flat();
      })
    );

    return query$;
  }

  getAnomalias$(informeId: string, tipo?: 'anomalias' | 'pcs'): Observable<Anomalia[]> {
    if (tipo !== 'pcs') {
      tipo = 'anomalias';
    }

    const query$ = this.afs
      .collection<Anomalia>(tipo, (ref) => ref.where('informeId', '==', informeId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data() as Anomalia;
            data.id = doc.payload.doc.id;
            data.perdidas = this.getPerdidas(data); // cambiamos el valor de la DB por uno basado en el tipo
            data.severidad = this.getCoA(data); // cambiamos el valor de la DB por uno basado en el tipo
            data.criticidad = this.getCriticidad(data); // DEMO licitacion
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
    // comprobamos que se está aplicando un criterio
    if (this.criterioCoA !== undefined) {
      // Los que siempre son CoA 3, tengan la temperatura que tengan
      if (this.criterioCoA.hasOwnProperty('siempreCoA3')) {
        if (this.criterioCoA.siempreCoA3.includes(anomalia.tipo)) {
          return 3;
        }
      }

      // El resto
      // Si superan tempCoA3
      if (this.criterioCoA.hasOwnProperty('tempCoA3')) {
        if (anomalia.temperaturaMax >= this.criterioCoA.tempCoA3) {
          return 3;
        }
      }

      // Si no la supera, la clasificamos según su gradiente
      if (anomalia.gradienteNormalizado >= this.criterioCoA.rangosDT[2]) {
        return 3;
      } else {
        if (this.criterioCoA.hasOwnProperty('siempreCoA2')) {
          if (this.criterioCoA.siempreCoA2.includes(anomalia.tipo)) {
            return 2;
          }
        }
        if (anomalia.gradienteNormalizado >= this.criterioCoA.rangosDT[1]) {
          return 2;
        } else if (anomalia.gradienteNormalizado >= this.criterioCoA.rangosDT[0]) {
          return 1;
        }
      }

      if (this.criterioCoA.hasOwnProperty('siempreVisible')) {
        if (this.criterioCoA.siempreVisible.includes(anomalia.tipo)) {
          return 1;
        }
      }
    } else {
      return 0;
    }
  }

  private getCriticidad(anomalia: Anomalia): number {
    let criticidad: number;
    if (this.criterioCriticidad !== undefined) {
      /* if (this.criterioCriticidad.hasOwnProperty('siempreVisible')) {
        this.criterioCriticidad.siempreVisible.forEach((v, i) => {
          if (v.includes(anomalia.tipo)) {
            return i;
          }
        });
      } */
      if (this.criterioCriticidad.hasOwnProperty('rangosDT')) {
        const rangosDT = this.criterioCriticidad.rangosDT;

        rangosDT.forEach((v, i) => {
          if (anomalia.gradienteNormalizado >= v) {
            criticidad = i + 1;
          }
        });
        return criticidad;
      }
    } else {
      return criticidad;
    }
  }

  getPerdidasColor(anomalias: Anomalia[], anomaliaSelected: Anomalia) {
    const perdidas = anomalias.map((anom) => anom.perdidas);
    const perdidasMax = Math.max(...perdidas);
    const perdidasMin = Math.min(...perdidas);

    if (anomaliaSelected.perdidas <= (perdidasMax - perdidasMin) / 3) {
      return GLOBAL.colores_mae[0];
    } else if (anomaliaSelected.perdidas <= (2 * (perdidasMax - perdidasMin)) / 3) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  getCelsCalientesColor(anomaliaSelected: Anomalia) {
    if (anomaliaSelected.tipo === 8 || anomaliaSelected.tipo === 9) {
      return GLOBAL.colores_mae[0];
    } else {
      return 'rgba(0,0,0,0)';
    }
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

  get inicialized() {
    return this._initialized;
  }

  set inicialized(value: boolean) {
    this._initialized = value;
    this.initialized$.next(value);
  }
}
