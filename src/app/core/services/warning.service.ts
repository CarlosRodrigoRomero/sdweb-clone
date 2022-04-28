import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import { Observable } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { ReportControlService } from './report-control.service';

import { Warning, warnings } from '@shared/components/warnings-menu/warnings';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';
import { LocationAreaInterface } from '@core/models/location';

@Injectable({
  providedIn: 'root',
})
export class WarningService {
  constructor(
    private afs: AngularFirestore,
    private reportControlService: ReportControlService,
    private http: HttpClient,
    private storage: AngularFireStorage
  ) {}

  addWarning(informeId: string, warning: Warning) {
    // obtenemos un ID aleatorio
    const id = this.afs.createId();

    // solo guardamos algunos campos
    warning = this.getDbFields(warning);

    this.afs
      .collection<Warning>('informes/' + informeId + '/warnings')
      .doc(id)
      .set(warning)
      .then(() => {
        console.log(`Alerta de tipo ${warning.type} añadida correctamente`);
      })
      .catch((error) => {
        console.error('Error al añadir alerta: ', error);
      });
  }

  updateWarning(informeId: string, warning: Warning) {
    // separamos el ID porque no lo guardamos en la base de datos
    const warningId = warning.id;

    // solo guardamos algunos campos
    warning = this.getDbFields(warning);

    const colRef = this.afs.collection('informes/' + informeId + '/warnings');

    colRef
      .doc(warningId)
      .update(warning)
      .then(() => {
        console.log('Alerta actualizada correctamente');
      })
      .catch((error) => {
        console.error('Error al actualizar alerta: ', error);
      });
  }

  getWarningByType(informeId: string, type: string): Observable<Warning[]> {
    const query$ = this.afs
      .collection<Warning>('informes/' + informeId + '/warnings', (ref) => ref.where('type', '==', type))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();
            data.id = doc.payload.doc.id;

            const warning = warnings.find((w) => w.type === data.type);

            if (warning !== undefined) {
              data.message = warning.message;
              data.adminActions = warning.adminActions;
              data.reportActions = warning.reportActions;
            }

            return data;
          })
        )
      );
    return query$;
  }

  getWarnings(informeId: string): Observable<Warning[]> {
    const query$ = this.afs
      .collection<Warning>('informes/' + informeId + '/warnings')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            const data = doc.payload.doc.data();
            data.id = doc.payload.doc.id;

            const warning = warnings.find((w) => w.type === data.type);

            if (warning !== undefined) {
              data.message = warning.message;
              data.adminActions = warning.adminActions;
              data.reportActions = warning.reportActions;
            }

            return data;
          })
        )
      );
    return query$;
  }

  deleteWarning(informeId: string, warningId: string) {
    const colRef = this.afs.collection('informes/' + informeId + '/warnings');

    colRef
      .doc(warningId)
      .delete()
      .then(() => {
        console.log('Alerta borrada correctamente');
      })
      .catch((error) => {
        console.error('Error al borrar alerta: ', error);
      });
  }

  private getDbFields(warning: Warning): any {
    return {
      type: warning.type,
      visible: warning.visible,
    };
  }

  private checkAddWarning(warning: Warning, warns: Warning[], informeId: string) {
    if (!warns.map((warn) => warn.type).includes(warning.type)) {
      this.addWarning(informeId, warning);
    }
  }

  private checkOldWarning(type: string, warns: Warning[], informeId: string) {
    const oldWarning = warns.find((warn) => warn.type === type);

    if (oldWarning) {
      this.deleteWarning(informeId, oldWarning.id);
    }
  }

  checkTiposAnoms(informe: InformeInterface, anomalias: Anomalia[], warns: Warning[]): boolean {
    if (informe !== undefined && anomalias.length > 0) {
      if (informe.hasOwnProperty('tiposAnomalias') && informe.tiposAnomalias.length > 0) {
        // primero eliminamos la alerta antigua de no tener tipoAnoms si la hubiera
        this.checkOldWarning('tiposAnom', warns, informe.id);

        const sumTiposAnom = informe.tiposAnomalias.reduce((acum, curr, index) => {
          // las celulas calientes son un array por separado
          if (index === 8 || index === 9) {
            return acum + curr.reduce((a, c) => a + c);
          } else {
            return acum + curr;
          }
        });

        if (anomalias.length !== sumTiposAnom) {
          const warning: Warning = {
            type: 'sumTiposAnom',
            visible: true,
          };

          this.checkAddWarning(warning, warns, informe.id);
        } else {
          // eliminamos la alerta antigua si la hubiera
          this.checkOldWarning('sumTiposAnom', warns, informe.id);
        }
      } else {
        const warning: Warning = {
          type: 'tiposAnom',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informe.id);
      }
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkNumsCoA(informe: InformeInterface, anomalias: Anomalia[], warns: Warning[]): boolean {
    if (informe !== undefined && anomalias.length > 0) {
      if (informe.numsCoA.length > 0) {
        // primero eliminamos la alerta antigua de no tener numsCoA si la hubiera
        this.checkOldWarning('numsCoA', warns, informe.id);

        const sumNumsCoA = informe.numsCoA.reduce((acum, curr) => acum + curr);

        if (anomalias.length !== sumNumsCoA) {
          const warning: Warning = {
            type: 'sumNumsCoA',
            visible: true,
          };

          this.checkAddWarning(warning, warns, informe.id);
        } else {
          // eliminamos la alerta antigua si la hubiera
          this.checkOldWarning('sumNumsCoA', warns, informe.id);
        }
      } else {
        const warning: Warning = {
          type: 'numsCoA',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informe.id);
      }
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkNumsCriticidad(informe: InformeInterface, anomalias: Anomalia[], warns: Warning[]): boolean {
    if (informe !== undefined && anomalias.length > 0) {
      if (informe.numsCriticidad.length > 0) {
        // primero eliminamos la alerta antigua de no tener numsCoA si la hubiera
        this.checkOldWarning('numsCriticidad', warns, informe.id);

        const sumNumsCriticidad = informe.numsCriticidad.reduce((acum, curr) => acum + curr);

        if (anomalias.length !== sumNumsCriticidad) {
          const warning: Warning = {
            type: 'sumNumsCriticidad',
            visible: true,
          };

          this.checkAddWarning(warning, warns, informe.id);
        } else {
          // eliminamos la alerta antigua si la hubiera
          this.checkOldWarning('sumNumsCriticidad', warns, informe.id);
        }
      } else {
        const warning: Warning = {
          type: 'numsCriticidad',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informe.id);
      }
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkMAE(informe: InformeInterface, warns: Warning[]): boolean {
    if (informe.mae >= 1) {
      const warning: Warning = {
        type: 'mae',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informe.id);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarning('mae', warns, informe.id);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkCC(informe: InformeInterface, warns: Warning[]): boolean {
    if (informe.cc >= 1) {
      const warning: Warning = {
        type: 'cc',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informe.id);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarning('cc', warns, informe.id);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkFilsColsPlanta(planta: PlantaInterface, informe: InformeInterface, warns: Warning[]): boolean {
    if (planta.columnas <= 1 || planta.columnas === undefined || planta.columnas === null) {
      let warning: Warning;
      if (planta.tipo === 'seguidores') {
        warning = {
          type: 'filsColsPlantaSegs',
          visible: true,
        };
      } else {
        warning = {
          type: 'filsColsPlantaFija',
          visible: true,
        };
      }

      this.checkAddWarning(warning, warns, informe.id);
    } else {
      // eliminamos la alerta antigua si la hubiera
      if (planta.tipo === 'seguidores') {
        this.checkOldWarning('filsColsPlantaSegs', warns, informe.id);
      } else {
        this.checkOldWarning('filsColsPlantaFija', warns, informe.id);
      }
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkFilsColsAnoms(
    planta: PlantaInterface,
    anomalias: Anomalia[],
    informe: InformeInterface,
    warns: Warning[]
  ): boolean {
    // primero comprobamos que el nº de filas y columnas de la planta sean correctos
    if (planta.columnas > 1 && planta.columnas !== undefined && planta.columnas !== null) {
      const differentFilColAnoms = anomalias.filter(
        (anom) => anom.localY > planta.filas || anom.localX > planta.columnas
      );

      if (differentFilColAnoms.length > 0) {
        const warning: Warning = {
          type: 'filsColsAnoms',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informe.id);
      } else {
        // eliminamos la alerta antigua si la hubiera
        this.checkOldWarning('filsColsAnoms', warns, informe.id);
      }
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkZonesWarnings(
    locAreas: LocationAreaInterface[],
    informe: InformeInterface,
    warns: Warning[],
    planta: PlantaInterface,
    anomalias: Anomalia[]
  ): boolean {
    if (locAreas.length > 0) {
      // primero eliminamos la alerta antigua de no locAreas si la hubiera
      this.checkOldWarning('noLocAreas', warns, informe.id);

      let wrongLocAnomsChecked = false;
      // solo para fijas y S1E puede comprobamos las anomalias fuera de zonas
      if (planta.tipo !== 'seguidores') {
        wrongLocAnomsChecked = this.checkWrongLocationAnoms(anomalias, warns, informe.id);
      }
      const noGlobalCoordsAnomsChecked = this.checkNoGlobalCoordsAnoms(anomalias, warns, informe.id);
      const zonesNamesChecked = this.checkZonesNames(planta, warns, informe.id);
      const modulosChecked = this.checkModulosWarnings(locAreas, warns, informe.id, anomalias);

      // comprobamos que todas alertas de zonas han sido checkeadas
      if (planta.tipo !== 'seguidores') {
        if (wrongLocAnomsChecked && noGlobalCoordsAnomsChecked && zonesNamesChecked && modulosChecked) {
          return true;
        }
      } else {
        if (noGlobalCoordsAnomsChecked && zonesNamesChecked && modulosChecked) {
          return true;
        }
      }
    } else {
      // añadimos el aviso de que faltan las zonas de la planta
      const warning: Warning = {
        type: 'noLocAreas',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informe.id);

      // confirmamos que ha sido checkeado
      return true;
    }
  }

  private checkWrongLocationAnoms(anomalias: Anomalia[], warns: Warning[], informeId: string): boolean {
    const numGlobalCoords = this.reportControlService.getNumGlobalCoords(anomalias);

    if (numGlobalCoords > 0) {
      const anomsWrongGlobals = anomalias.filter((anom) => anom.globalCoords[numGlobalCoords - 1] === null);

      if (anomsWrongGlobals.length > 0) {
        const warning: Warning = {
          type: 'wrongLocAnoms',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informeId);
      } else {
        // eliminamos la alerta antigua si la hubiera
        this.checkOldWarning('wrongLocAnoms', warns, informeId);
      }
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkNoGlobalCoordsAnoms(anomalias: Anomalia[], warns: Warning[], informeId: string): boolean {
    const noGlobalCoordsAnoms = anomalias.filter(
      (anom) => anom.globalCoords === null || anom.globalCoords === undefined || anom.globalCoords[0] === null
    );

    if (noGlobalCoordsAnoms.length > 0) {
      const warning: Warning = {
        type: 'noGlobalCoordsAnoms',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informeId);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarning('noGlobalCoordsAnoms', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkZonesNames(planta: PlantaInterface, warns: Warning[], informeId: string): boolean {
    if (
      !planta.hasOwnProperty('nombreGlobalCoords') ||
      planta.nombreGlobalCoords === null ||
      planta.nombreGlobalCoords === undefined ||
      planta.nombreGlobalCoords.length === 0
    ) {
      const warning: Warning = {
        type: 'nombresZonas',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informeId);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarning('nombresZonas', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkModulosWarnings(
    locAreas: LocationAreaInterface[],
    warns: Warning[],
    informeId: string,
    anomalias: Anomalia[]
  ): boolean {
    const areasConModulo = locAreas.filter(
      (locArea) => locArea.hasOwnProperty('modulo') && locArea.modulo !== null && locArea.modulo !== undefined
    );

    if (areasConModulo.length > 0) {
      // primero eliminamos la alerta antigua de no hay modulos en la planta si la hubiera
      this.checkOldWarning('modulosPlanta', warns, informeId);

      const modulosAnomsChecked = this.checkModulosAnoms(anomalias, warns, informeId);

      if (modulosAnomsChecked) {
        return true;
      }
    } else {
      // añadimos el aviso de que faltan los modulos de la planta
      const warning: Warning = {
        type: 'modulosPlanta',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informeId);

      // confirmamos que ha sido checkeado
      return true;
    }
  }

  private checkModulosAnoms(anomalias: Anomalia[], warns: Warning[], informeId: string): boolean {
    const anomsSinModulo = anomalias.filter((anom) => anom.modulo === null || anom.modulo === undefined);

    if (anomsSinModulo.length > 0) {
      const warning: Warning = {
        type: 'modulosAnoms',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informeId);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarning('modulosAnoms', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkAerialLayer(informeId: string, warns: Warning[]): boolean {
    const url = 'https://solardrontech.es/tileserver.php?/index.json?/' + informeId + '_visual/1/1/1.png';

    this.http
      .get(url)
      .pipe(
        take(1),
        catchError((error) => {
          // no recibimos respuesta del servidor porque no existe
          if (error.status === 0) {
            const warning: Warning = {
              type: 'visualLayer',
              visible: true,
            };

            this.checkAddWarning(warning, warns, informeId);
          } else {
            // si recibimos respuesta del servidor, es que existe la capa
            // y eliminamos la alerta antigua si la hubiera
            this.checkOldWarning('visualLayer', warns, informeId);
          }

          return [];
        }),
        take(1)
      )
      .subscribe((data) => console.log(''));

    // confirmamos que ha sido checkeado
    return true;
  }

  checkThermalLayer(informeId: string, warns: Warning[]): boolean {
    const url = 'https://solardrontech.es/tileserver.php?/index.json?/' + informeId + '_thermal/1/1/1.png';

    this.http
      .get(url)
      .pipe(
        take(1),
        catchError((error) => {
          // no recibimos respuesta del servidor porque no existe
          if (error.status === 0) {
            const warning: Warning = {
              type: 'thermalLayer',
              visible: true,
            };

            this.checkAddWarning(warning, warns, informeId);
          } else {
            // si recibimos respuesta del servidor, es que existe la capa
            // y eliminamos la alerta antigua si la hubiera
            this.checkOldWarning('thermalLayer', warns, informeId);
          }

          return [];
        }),
        take(1)
      )
      .subscribe((data) => console.log(''));

    // confirmamos que ha sido checkeado
    return true;
  }

  checkImagePortada(informeId: string, warns: Warning[]): boolean {
    this.storage
      .ref(`informes/${informeId}/portada.jpg`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        // eliminamos la alerta antigua si la hubiera
        this.checkOldWarning('imgPortada', warns, informeId);
      })
      .catch((error) => {
        const warning: Warning = {
          type: 'imgPortada',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informeId);
      });

    // confirmamos que ha sido checkeado
    return true;
  }

  checkImageSuciedad(informeId: string, warns: Warning[]): boolean {
    this.storage
      .ref(`informes/${informeId}/suciedad.jpg`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        // eliminamos la alerta antigua si la hubiera
        this.checkOldWarning('imgSuciedad', warns, informeId);
      })
      .catch((error) => {
        const warning: Warning = {
          type: 'imgSuciedad',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informeId);
      });

    // confirmamos que ha sido checkeado
    return true;
  }

  checkTempMaxAnomsError(anomalias: Anomalia[], warns: Warning[], informeId: string): boolean {
    const highestTemp = anomalias.sort((a, b) => b.temperaturaMax - a.temperaturaMax)[0].temperaturaMax;

    const wrongMaxTempAnoms = anomalias.filter((anom) => anom.temperaturaMax === highestTemp);

    // si son más de 10 con la temp max es un error en el calculo
    if (wrongMaxTempAnoms.length > 10) {
      const warning: Warning = {
        type: 'tempMaxAnoms',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informeId);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarning('tempMaxAnoms', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }
}
