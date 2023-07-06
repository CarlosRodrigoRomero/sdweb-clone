import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import { Observable, combineLatest, BehaviorSubject, iif, of, Subscription } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';

import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';

import { PlantaService } from '@data/services/planta.service';
import { UserService } from './user.service';
import { OlMapService } from './ol-map.service';
import { AnomaliaInfoService } from './anomalia-info.service';
import { ZonesService } from './zones.service';

import { Anomalia } from '@core/models/anomalia';
import { CritCoA } from '@core/models/critCoA';
import { CritCriticidad } from '@core/models/critCriticidad';
import { PcInterface } from '@core/models/pc';
import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';
import { LocationAreaInterface } from '@core/models/location';
import { ModuloInterface } from '@core/models/modulo';
import { TipoSeguidor } from '@core/models/tipoSeguidor';

import { GLOBAL } from '@data/constants/global';

import { Patches } from '@core/classes/patches';

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
  planta: PlantaInterface;
  private locAreasTipoSeguidor: LocationAreaInterface[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    public afs: AngularFirestore,
    private storage: AngularFireStorage,
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private anomaliaInfoService: AnomaliaInfoService,
    private zonesService: ZonesService,
    private userService: UserService
  ) {}

  initService(plantaId: string): Promise<void> {
    // obtenemos el criterio de criticidad de la planta si tuviese
    return new Promise((resolve, reject) => {
      this.subscriptions.add(
        this.plantaService
          .getPlanta(plantaId)
          .pipe(
            take(1),
            switchMap((planta) => {
              this.planta = planta;

              return this.getCriterioId(planta);
            }),
            switchMap((criterioId) => this.plantaService.getCriterioCriticidad(criterioId))
          )
          .subscribe((criterio: CritCriticidad) => {
            if (criterio.labels !== undefined) {
              this.criterioCriticidad = criterio;
            }

            // servicio iniciado
            resolve();
          })
      );
    });
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
          anomalia.tipo = Number(anomalia.tipo);
          return anomalia;
        } else {
          return null;
        }
      })
    );
  }

  getAnomaliasPlanta$(
    planta: PlantaInterface,
    informes: InformeInterface[],
    criterio?: CritCriticidad
  ): Observable<Anomalia[]> {
    if (this.planta === undefined) {
      this.planta = planta;
    }

    this.getLocAreasTipoSeguidor();

    const anomaliaObsList = Array<Observable<Anomalia[]>>();
    informes.forEach((informe) => {
      if (criterio !== undefined) {
        // traemos ambos tipos de anomalias por si hay pcs antiguos
        anomaliaObsList.push(this.getAnomalias$(informe.id, 'pcs', criterio));
        anomaliaObsList.push(this.getAnomalias$(informe.id, 'anomalias', criterio));
      } else {
        // traemos ambos tipos de anomalias por si hay pcs antiguos
        anomaliaObsList.push(this.getAnomalias$(informe.id, 'pcs'));
        anomaliaObsList.push(this.getAnomalias$(informe.id, 'anomalias'));
      }
    });

    return combineLatest(anomaliaObsList).pipe(map((arr) => arr.flat()));
  }

  getAnomaliasInforme$(informeId: string): Observable<Anomalia[]> {
    const anomaliaObsList = Array<Observable<Anomalia[]>>();

    anomaliaObsList.push(this.getAnomalias$(informeId, 'anomalias'));

    return combineLatest(anomaliaObsList).pipe(map((arr) => arr.flat()));
  }

  getAnomalias$(informeId: string, tipo?: 'anomalias' | 'pcs', criterio?: CritCriticidad): Observable<Anomalia[]> {
    const query$ = this.afs
      .collection<Anomalia>(tipo, (ref) => ref.where('informeId', '==', informeId))
      .snapshotChanges()
      .pipe(
        take(1),
        map((actions) => {
          let anoms = actions.map((doc, index) => {
            let data = doc.payload.doc.data() as Anomalia;
            data.id = doc.payload.doc.id;
            data.tipo = Number(data.tipo);

            if (data.hasOwnProperty('tipoNextYear')) {
              data.tipoNextYear = Number(data.tipoNextYear);
            } else {
              data.tipoNextYear = data.tipo;
            }

            // DEMO
            // const tiposDemo = [data.tipo, 12];
            // const indiceAleatorio = Math.floor(Math.random() * tiposDemo.length);
            // data.tipoNextYear = tiposDemo[indiceAleatorio];

            // Parche para Casas de Don Pedro Jun22 y Alqueva Sep22
            if (Patches.checkId(informeId)) {
              data = Patches.applyPatches(informeId, data);
            }

            data.perdidas = this.getPerdidas(data); // cambiamos el valor de la DB por uno basado en el tipo
            data.clase = this.getCoA(data); // cambiamos el valor de la DB por uno basado en el tipo
            if (criterio !== undefined) {
              data.criticidad = this.getCriticidad(data, criterio);
            } else {
              data.criticidad = this.getCriticidad(data);
            }
            if (data.globalCoords !== undefined && data.globalCoords !== null) {
              data.globalCoords = Object.values(data.globalCoords); // pasamos los objetos a array
            }
            if (data.datetime !== undefined) {
              data.datetime = this.getRightDatetime(data.datetime);
              if (!data.hasOwnProperty('temperaturaRef') || data.temperaturaRef === 0) {
                if (data.hasOwnProperty('temperaturaMax') && data.hasOwnProperty('gradienteNormalizado')) {
                  data.temperaturaRef = data.temperaturaMax - data.gradienteNormalizado;
                }
              }
            }
            if (tipo === 'pcs') {
              data.localX = Number((data as PcInterface).local_x);
              data.localY = Number((data as PcInterface).local_y);
              if (data.globalCoords === undefined) {
                data.globalCoords = [];

                const globalX = (data as PcInterface).global_x;
                const globalY = (data as PcInterface).global_y;
                const globalZ = (data as PcInterface).global_z;

                if (globalX !== undefined && globalX !== null && globalX !== '' && !isNaN(globalX)) {
                  data.globalCoords.push(globalX);

                  if (globalY !== undefined && globalY !== null && globalY !== '' && !isNaN(globalY)) {
                    data.globalCoords.push(globalY);

                    if (globalZ !== undefined && globalZ !== null && globalZ !== '' && !isNaN(globalZ)) {
                      data.globalCoords.push(globalZ);
                    }
                  }
                }
              }
              data.localId = this.getLocalId(data, this.planta);
            } else {
              // Convertimos el objeto en un array
              data.featureCoords = Object.values(data.featureCoords);

              // comprobamos si hay zonas tipoSeguidor
              if (this.locAreasTipoSeguidor.length > 0) {
                const zonaTipoSeguidor = this.getZonaTipoSeguidor(data);
                let tipoSeguidor: TipoSeguidor;
                if (zonaTipoSeguidor !== undefined) {
                  tipoSeguidor = zonaTipoSeguidor.tipoSeguidor;
                  data.tipoSeguidor = tipoSeguidor;
                }
              }
            }

            return data;
          });

          // ordenamos las anomalias por tipo de más grave a menos grave
          anoms = this.sortAnomsByTipo(anoms);

          // añadimos un numero individual a cada anomalía
          anoms = this.addNumAnom(anoms);

          return anoms;
        })
      );

    return query$;
  }

  getRealAnomalias(anomalias: Anomalia[]): Anomalia[] {
    // quitamos las anomalias con criticidad null ya que no son anomalias para el cliente
    let realAnomalias = anomalias.filter((anom) => anom.criticidad !== null);

    // quitamos las anomalias de tipos en desuso
    realAnomalias = realAnomalias.filter((anom) => !GLOBAL.tipos_no_utilizados.includes(anom.tipo));

    // quitamos la suciedad como anomalía
    realAnomalias = realAnomalias.filter((anom) => anom.tipo !== 11);

    return realAnomalias;
  }

  private getZonaTipoSeguidor(anom: Anomalia) {
    const zonaTipoSeguidor = this.locAreasTipoSeguidor.find((locA) => this.zonesService.isAnomInsideZone(anom, locA));

    return zonaTipoSeguidor;
  }

  private getLocAreasTipoSeguidor() {
    const locAreas = this.zonesService.locAreas;

    // guardamos las zonas con tipoSeguidor
    this.locAreasTipoSeguidor = locAreas.filter((locArea) => locArea.tipoSeguidor !== undefined);
  }

  private getRightDatetime(datetime: number) {
    if (datetime.toString().length === 19) {
      return datetime / 1000000000;
    } else {
      return datetime;
    }
  }

  async updateAnomalia(anomalia: Anomalia) {
    const anomaliaObj = this._prepararParaDb(anomalia);
    const anomaliaDoc = this.afs.doc('anomalias/' + anomalia.id);
    return anomaliaDoc.set(anomaliaObj);
  }

  updateAnomaliaField(id: string, field: string, value: any) {
    const anomalia = {};
    anomalia[field] = value;

    this.afs
      .collection('anomalias')
      .doc(id)
      .update(anomalia)
      .then((res) => {
        console.log('Campo ' + field + ' de anomalia con id ' + id + ' actualizado correctamente');
      })
      .catch((err) => {
        console.log('Error al actualizar campo ' + field + ' de anomalia con id ' + id);
        console.log(err);
      });
  }

  async deleteAnomalia(anomalia: Anomalia) {
    return this.afs.doc('anomalias/' + anomalia.id).delete();
  }

  getCriterioId(planta: PlantaInterface) {
    let criterioId: string;

    return this.userService.getUser(planta.empresa).pipe(
      take(1),
      map((user) => {
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

        // si la planta tiene criterio propio le damos prioridad sobre el de la empresa
        if (planta.hasOwnProperty('criterioId')) {
          this.hasCriticidad = true;
          criterioId = planta.criterioId;
        }

        if (criterioId === undefined || criterioId === null) {
          // si el cliente no tiene criterio propio asignamos el criterio por defecto Solardrone5
          criterioId = 'aU2iM5nM0S3vMZxMZGff';
        }

        return criterioId;
      })
    );
  }

  private addNumAnom(anomalias: Anomalia[]): Anomalia[] {
    const realAnomalias = this.getRealAnomalias(anomalias);

    realAnomalias.map((anom, index) => {
      anom.numAnom = index + 1;
      return anom;
    });

    return anomalias;
  }

  getLocalId(anomalia: Anomalia, planta: PlantaInterface): string {
    const parts: string[] = [];
    anomalia.globalCoords.forEach((coord) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        parts.push(coord);
      }
    });

    const numeroModulo = this.anomaliaInfoService.getNumeroModulo(anomalia, planta);

    if (numeroModulo !== null) {
      parts.push(numeroModulo.toString());
    } else {
      parts.push(anomalia.localX.toString());
      parts.push(anomalia.localY.toString());
    }

    let localId = '';

    parts.forEach((part, index) => {
      if (index < parts.length - 1) {
        localId += part + '.';
      } else {
        localId += part;
      }
    });

    return localId;
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

  private getCriticidad(anomalia: Anomalia, criterio?: CritCriticidad): number {
    // si hay criterio y no cumple ninguno devolvemos null
    let criticidad = null;
    let criterioCriticidad: CritCriticidad;
    if (criterio !== undefined) {
      criterioCriticidad = criterio;
    } else {
      criterioCriticidad = this.criterioCriticidad;
    }
    if (criterioCriticidad !== undefined) {
      // aquellas que siempre son de un criterio sin importar el gradiente
      if (criterioCriticidad.hasOwnProperty('criterioConstante')) {
        const criterioConstante = Object.values(criterioCriticidad.criterioConstante);
        criterioConstante.forEach((value, index) => {
          if (value.includes(anomalia.tipo)) {
            criticidad = index;
          }
        });
      }
      if (criterioCriticidad.hasOwnProperty('siempreVisible')) {
        // aquellas que deben verse aunque sean muy leves
        if (criterioCriticidad.siempreVisible.includes(anomalia.tipo)) {
          if (criticidad === null) {
            criticidad = 0;
          }
        }
      }
      if (criterioCriticidad.hasOwnProperty('rangosDT')) {
        if (criticidad === null) {
          // solo para el criterio de Plenium
          if (criterioCriticidad.id === 'cMYx030Kyp7hLhtUoYdQ') {
            // aquellas que dependen del gradiente y la temperatura Max
            if (criterioCriticidad.hasOwnProperty('rangosTMax')) {
              for (let index = 0; index < criterioCriticidad.rangosTMax.length; index++) {
                const rangoTMax = criterioCriticidad.rangosTMax[index];
                const rangoDT = criterioCriticidad.rangosDT[index];
                // para las LEVES solo buscamos que superen el rangoDT inferior
                if (index === 0) {
                  if (anomalia.gradienteNormalizado >= rangoDT) {
                    criticidad = index;
                  }
                // para las GRAVES buscamos que sean CCs y superen el rangoDT superior
                } else if (anomalia.tipo === 8 || anomalia.tipo === 9) {
                  if (anomalia.temperaturaMax >= rangoTMax || anomalia.gradienteNormalizado >= rangoDT) {
                    criticidad = index;
                  }
                }
              }
            }
          } else {
            // el resto de criterios
            criterioCriticidad.rangosDT.forEach((value, index) => {
              if (anomalia.gradienteNormalizado >= value) {
                criticidad = index;
              }
            });
          }
        }
      }
    } else {
      // si no hay criterio devolvemos undefined
      criticidad = undefined;
    }

    return criticidad;
  }

  getIrradiancia(date: number): number {
    const diasSolst = this.getDiffDiasSolsticio(date);
    const long = this.planta.longitud;

    const maxIrrad = 1000;
    const minIrrad = 900;
    const maxAncho = -0.01;
    const minAncho = -0.008;
    const maxDesplazLaterial = 4; // min/grado
    const minDesplazLaterial = 2; // min/grado

    const minASolArriba = this.getMinutosASolArriba(date);

    const limiteDiasEstable = 60;

    const A = maxAncho;
    let B = maxIrrad;
    if (diasSolst > limiteDiasEstable) {
      B = ((diasSolst - limiteDiasEstable) / (180 - limiteDiasEstable)) * (minIrrad - maxIrrad) + maxIrrad;
    }
    const C = Math.abs(long) * (((minDesplazLaterial - maxDesplazLaterial) * 2 * diasSolst) / 365 + maxDesplazLaterial);

    let irradiancia = Math.round(A * Math.pow(minASolArriba - C, 2) + B);

    if (irradiancia < 0) {
      irradiancia = 0;
    }

    return irradiancia;
  }

  private getDiffDiasSolsticio(date: number): number {
    const fechaAnom = new Date(date * 1000);
    const solsticioVerano = new Date(fechaAnom.getFullYear(), 5, 21);

    // Calculamos las diferencia entre las dos fechas
    const diferenciaFechas = solsticioVerano.getTime() - fechaAnom.getTime();

    // Convertimos a días
    const difenciaEnDias = diferenciaFechas / (1000 * 3600 * 24);

    return Math.abs(difenciaEnDias);
  }

  private getMinutosASolArriba(date: number): number {
    const fecha = new Date(date * 1000);
    const fechaSolArriba = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 14, 0, 0, 0);

    // Calculamos las diferencia entre las dos fechas
    const diferenciaFechas = fechaSolArriba.getTime() - fecha.getTime();

    // convertimos a minutos
    const difenciaEnMinutos = -(diferenciaFechas / (1000 * 60));

    return difenciaEnMinutos;
  }

  downloadImage(folder: string, anomalia: Anomalia) {
    let prefijo = 'visual';
    if (folder === 'jpg') {
      prefijo = 'radiometrico';
    }
    this.storage
      .ref(`informes/${anomalia.informeId}/${folder}/${anomalia.archivoPublico}`)
      .getDownloadURL()
      .pipe(take(1))
      .subscribe((downloadUrl) => {
        // (anomalia as PcInterface).downloadUrlStringRjpg = downloadUrl;
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
          a.download = `${prefijo}_${anomalia.archivoPublico}`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open('GET', downloadUrl);
        xhr.send();
      });
  }

  sortByLocalId(a: Anomalia, b: Anomalia) {
    if (a.localId < b.localId) {
      return -1;
    }
    if (a.localId > b.localId) {
      return 1;
    }
    return 0;
  }

  sortByGlobalCoords(a: Anomalia, b: Anomalia): number {
    let globalCoordsLength;
    a.globalCoords.forEach((coord, index) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        globalCoordsLength = index + 1;
      }
    });

    let value = 0;

    for (let index = 0; index < globalCoordsLength; index++) {
      if (a.globalCoords[index] < b.globalCoords[index]) {
        value = -1;
        break;
      }
      if (a.globalCoords[index] > b.globalCoords[index]) {
        value = 1;
        break;
      }
    }

    return value;
  }

  sortAnomsByTipo(anomalias: Anomalia[]): Anomalia[] {
    const sortedAnoms: Anomalia[] = [];

    GLOBAL.sortedAnomsTipos.forEach((tipo) => {
      // tslint:disable-next-line: triple-equals
      const anomsTipo = anomalias.filter((anom) => anom.tipo == tipo);

      sortedAnoms.push(...anomsTipo);
    });

    return sortedAnoms;
  }

  getModule(coords: Coordinate, locAreas: LocationAreaInterface[]): ModuloInterface {
    let modulo: ModuloInterface;
    const locAreasWithModule = locAreas.filter((locArea) => locArea.modulo !== undefined);

    if (locAreasWithModule.length === 1) {
      modulo = locAreasWithModule[0].modulo;
    } else {
      locAreasWithModule.forEach((locArea) => {
        const polygon = new Polygon(this.olMapService.latLonLiteralToLonLat((locArea as any).path));

        if (polygon.intersectsCoordinate(coords)) {
          modulo = locArea.modulo;
        }
      });
    }
    if (modulo === undefined) {
      modulo = null;
    }

    return modulo;
  }

  resetService() {
    this.selectedInformeId = undefined;
    this.allAnomaliasInforme = undefined;
    this.criterioCoA = GLOBAL.criterioCoA;
    this.criterioCriticidad = undefined;
    this.hasCriticidad = false;
    this.planta = undefined;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  /////////////////////////////////////////////////////////////////////////////////////////////

  get selectedInformeId(): string {
    return this._selectedInformeId;
  }

  set selectedInformeId(value: string) {
    this._selectedInformeId = value;
  }

  get hasCriticidad() {
    return this._hasCriticidad;
  }

  set hasCriticidad(value: boolean) {
    this._hasCriticidad = value;
    this.hasCriticidad$.next(value);
  }
}
