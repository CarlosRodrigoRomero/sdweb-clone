import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import { Observable } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { ReportControlService } from '@data/services/report-control.service';
import { UtilitiesService } from '@data/services/utilities.service';
import { ZonesService } from '@data/services/zones.service';
import { GeoserverService } from '@data/services/geoserver.service';

import { Warning, warnings } from '@shared/components/warnings-menu/warnings';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';
import { LocationAreaInterface } from '@core/models/location';
import { Seguidor } from '@core/models/seguidor';

@Injectable({
  providedIn: 'root',
})
export class WarningService {
  private warningTypes = warnings.map((w) => w.type);
  private warningsAdded: string[] = [];

  constructor(
    private afs: AngularFirestore,
    private reportControlService: ReportControlService,
    private http: HttpClient,
    private storage: AngularFireStorage,
    private zonesService: ZonesService,
    private geoserverService: GeoserverService
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

  checkWarnings(
    informe: InformeInterface,
    anomalias: Anomalia[],
    warns: Warning[],
    planta: PlantaInterface,
    locAreas: LocationAreaInterface[],
    seguidores?: Seguidor[]
  ): boolean {
    // reseteamos las alertas añadidas
    this.warningsAdded = warns.map((warn) => warn.type);

    const tiposAnomsChecked = this.checkTiposAnoms(informe, anomalias, warns);
    const numsCoAChecked = this.checkNumsCoA(informe, anomalias, warns);
    const numsCritChecked = this.checkNumsCriticidad(informe, anomalias, warns);
    const maeChecked = this.checkMAE(informe, warns);
    const ccChecked = this.checkCC(informe, warns);
    const filsColsPlantaChecked = this.checkFilsColsPlanta(planta, informe, warns);
    const filsColsAnomsChecked = this.checkFilsColsAnoms(planta, anomalias, informe, warns);
    const filsColsAnomsTipo0Checked = this.checkFilsColsTipo0Anoms(anomalias, informe, warns);
    const zonesChecked = this.checkZonesWarnings(locAreas, informe, warns, planta, anomalias);
    const visualLayerChecked = this.checkVisualLayer(informe, warns);
    const imgPortadaChecked = this.checkImagePortada(informe.id, warns);
    const imgSuciedadChecked = this.checkImageSuciedad(informe.id, warns);
    const tempMaxAnomsChecked = this.checkTempMaxAnomsError(anomalias, warns, informe.id);

    let thermalLayerChecked = false;
    if (planta.tipo === 'seguidores') {
      thermalLayerChecked = true;
    } else {
      thermalLayerChecked = this.checkThermalLayer(informe, warns);
    }

    let segsMismoNombreChecked = false;
    if (seguidores) {
      segsMismoNombreChecked = this.checkSegsRepeatName(seguidores, warns, informe.id);
    } else {
      segsMismoNombreChecked = true;
    }

    if (
      tiposAnomsChecked &&
      numsCoAChecked &&
      numsCritChecked &&
      maeChecked &&
      ccChecked &&
      filsColsPlantaChecked &&
      filsColsAnomsChecked &&
      filsColsAnomsTipo0Checked &&
      zonesChecked &&
      visualLayerChecked &&
      thermalLayerChecked &&
      imgPortadaChecked &&
      imgSuciedadChecked &&
      tempMaxAnomsChecked
    ) {
      // eliminamos posibles alertas que ya no sean necesarias
      this.checkUnusedWarnings(warns, informe.id);

      // indicamos que todas las alertas han sido checkeadas
      return true;
    }
  }

  private checkAddWarning(warning: Warning, warns: Warning[], informeId: string) {
    const existWarnings = warns.filter((warn) => warn.type === warning.type);

    if (existWarnings.length === 0) {
      this.warningsAdded.push(warning.type);
      this.addWarning(informeId, warning);
    } else if (existWarnings.length > 1) {
      // eliminamos los duplicados
      existWarnings.pop();
      existWarnings.forEach((warn) => this.deleteWarning(informeId, warn.id));
    }
  }

  private checkOldWarnings(type: string, warns: Warning[], informeId: string) {
    const oldWarnings = warns.filter((warn) => warn.type === type);

    if (oldWarnings.length > 0) {
      oldWarnings.forEach((oldWarning) => this.deleteWarning(informeId, oldWarning.id));
    }
  }

  private checkUnusedWarnings(warns: Warning[], informeId: string) {
    const warnsUnused = warns.filter(
      (warn) => !this.warningsAdded.includes(warn.type) || !this.warningTypes.includes(warn.type)
    );

    if (warnsUnused.length > 0) {
      warnsUnused.forEach((warn) => this.deleteWarning(informeId, warn.id));
    }
  }

  private checkTiposAnoms(informe: InformeInterface, anomalias: Anomalia[], warns: Warning[]): boolean {
    if (informe !== undefined && anomalias.length > 0) {
      if (informe.hasOwnProperty('tiposAnomalias') && informe.tiposAnomalias.length > 0) {
        // primero eliminamos la alerta antigua de no tener tipoAnoms si la hubiera
        this.checkOldWarnings('tiposAnom', warns, informe.id);

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
          this.checkOldWarnings('sumTiposAnom', warns, informe.id);
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
        this.checkOldWarnings('numsCoA', warns, informe.id);

        const sumNumsCoA = informe.numsCoA.reduce((acum, curr) => acum + curr);

        if (anomalias.length !== sumNumsCoA) {
          const warning: Warning = {
            type: 'sumNumsCoA',
            visible: true,
          };

          this.checkAddWarning(warning, warns, informe.id);
        } else {
          // eliminamos la alerta antigua si la hubiera
          this.checkOldWarnings('sumNumsCoA', warns, informe.id);
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
        this.checkOldWarnings('numsCriticidad', warns, informe.id);

        const sumNumsCriticidad = informe.numsCriticidad.reduce((acum, curr) => acum + curr);

        if (anomalias.length !== sumNumsCriticidad) {
          const warning: Warning = {
            type: 'sumNumsCriticidad',
            visible: true,
          };

          this.checkAddWarning(warning, warns, informe.id);
        } else {
          // eliminamos la alerta antigua si la hubiera
          this.checkOldWarnings('sumNumsCriticidad', warns, informe.id);
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
      this.checkOldWarnings('mae', warns, informe.id);
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
      this.checkOldWarnings('cc', warns, informe.id);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkFilsColsPlanta(planta: PlantaInterface, informe: InformeInterface, warns: Warning[]): boolean {
    // esta alerta solo es para S2E
    if (planta.columnas <= 1 || planta.columnas === undefined || planta.columnas === null) {
      let warning: Warning;
      if (planta.tipo === 'seguidores') {
        warning = {
          type: 'filsColsPlantaSegs',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informe.id);
      }
    } else {
      // eliminamos la alerta antigua si la hubiera
      if (planta.tipo === 'seguidores') {
        this.checkOldWarnings('filsColsPlantaSegs', warns, informe.id);
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
        (anom) => anom.localX === 0 || anom.localY === 0 || anom.localY > planta.filas || anom.localX > planta.columnas
      );

      if (differentFilColAnoms.length > 0) {
        const warning: Warning = {
          type: 'filsColsAnoms',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informe.id);
      } else {
        // eliminamos la alerta antigua si la hubiera
        this.checkOldWarnings('filsColsAnoms', warns, informe.id);
      }
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkFilsColsTipo0Anoms(anomalias: Anomalia[], informe: InformeInterface, warns: Warning[]): boolean {
    const differentFilColAnoms = anomalias.filter((anom) => anom.localX == 0 || anom.localY == 0);

    if (differentFilColAnoms.length > 0) {
      const warning: Warning = {
        type: 'filsColsAnoms0',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informe.id);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarnings('filsColsAnoms0', warns, informe.id);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkZonesWarnings(
    locAreas: LocationAreaInterface[],
    informe: InformeInterface,
    warns: Warning[],
    planta: PlantaInterface,
    anomalias: Anomalia[]
  ): boolean {
    if (locAreas.length > 0) {
      // primero eliminamos la alerta antigua de no locAreas si la hubiera
      this.checkOldWarnings('noLocAreas', warns, informe.id);

      const wrongLocAnomsChecked = this.checkWrongLocationAnoms(anomalias, warns, informe.id, planta);
      const noGlobalCoordsAnomsChecked = this.checkNoGlobalCoordsAnoms(anomalias, warns, informe.id);
      const zonesNamesChecked = this.checkZonesNames(planta, warns, informe.id);
      const zonesRepeatChecked = this.checkZonesRepeat(planta, locAreas, warns, informe.id);
      const modulosChecked = this.checkModulosWarnings(locAreas, warns, informe.id, anomalias);
      const tiposSeguidorChecked = this.checkTiposSeguidorWarnings(locAreas, warns, informe.id, planta);

      if (
        wrongLocAnomsChecked &&
        noGlobalCoordsAnomsChecked &&
        zonesNamesChecked &&
        zonesRepeatChecked &&
        modulosChecked &&
        tiposSeguidorChecked
      ) {
        return true;
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

  private checkWrongLocationAnoms(
    anomalias: Anomalia[],
    warns: Warning[],
    informeId: string,
    planta: PlantaInterface
  ): boolean {
    if (planta.tipo !== 'seguidores') {
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
          this.checkOldWarnings('wrongLocAnoms', warns, informeId);
        }
      }
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarnings('wrongLocAnoms', warns, informeId);
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
      this.checkOldWarnings('noGlobalCoordsAnoms', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkHaveZonesNames(planta: PlantaInterface): boolean {
    if (
      !planta.hasOwnProperty('nombreGlobalCoords') ||
      planta.nombreGlobalCoords === null ||
      planta.nombreGlobalCoords === undefined ||
      planta.nombreGlobalCoords.length === 0
    ) {
      return false;
    } else {
      return true;
    }
  }

  private checkZonesNames(planta: PlantaInterface, warns: Warning[], informeId: string): boolean {
    if (!this.checkHaveZonesNames(planta)) {
      const warning: Warning = {
        type: 'nombresZonas',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informeId);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarnings('nombresZonas', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkZonesRepeat(
    planta: PlantaInterface,
    locAreas: LocationAreaInterface[],
    warns: Warning[],
    informeId: string
  ) {
    let zones = this.zonesService.getZones(planta, locAreas);
    if (zones.length > 0) {
      zones = this.zonesService.getCompleteGlobals(zones).flat();
      const repeatZones = UtilitiesService.findDuplicates(zones.map((zone) => zone.globalCoords.toString()));

      if (repeatZones.length > 0) {
        console.log('Zonas con el mismo nombre: ' + repeatZones.join(' | '));

        const warning: Warning = {
          type: 'zonasRepeat',
          visible: true,
        };

        this.checkAddWarning(warning, warns, informeId);
      } else {
        // eliminamos la alerta antigua si la hubiera
        this.checkOldWarnings('zonasRepeat', warns, informeId);
      }
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
      this.checkOldWarnings('modulosPlanta', warns, informeId);

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

  private checkTiposSeguidorWarnings(
    locAreas: LocationAreaInterface[],
    warns: Warning[],
    informeId: string,
    planta: PlantaInterface
  ): boolean {
    if (planta.tipo === 'seguidores') {
      if (planta.alturaBajaPrimero || (planta.hasOwnProperty('columnaDchaPrimero') && planta.columnaDchaPrimero)) {
        const areasConTipoSeguidor = locAreas.filter((locArea) => locArea.hasOwnProperty('tipoSeguidor'));

        if (areasConTipoSeguidor.length > 0) {
          // primero eliminamos la alerta antigua de no hay tiposSeguidor si la hubiera
          this.checkOldWarnings('tiposSeguidor', warns, informeId);

          return true;
        } else {
          // añadimos el aviso de que faltan los modulos de la planta
          const warning: Warning = {
            type: 'tiposSeguidor',
            visible: true,
          };

          this.checkAddWarning(warning, warns, informeId);

          // confirmamos que ha sido checkeado
          return true;
        }
      } else {
        // eliminamos la alerta antigua de no hay tipoSeguidor si la hubiera
        this.checkOldWarnings('tiposSeguidor', warns, informeId);

        return true;
      }
    } else {
      // eliminamos la alerta antigua de no hay tipoSeguidor si la hubiera
      this.checkOldWarnings('tiposSeguidor', warns, informeId);

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
      this.checkOldWarnings('modulosAnoms', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkVisualLayer(informe: InformeInterface, warns: Warning[]): boolean {
    const url = this.geoserverService.getGeoserverUrl(informe, 'visual', true);

    this.http
      .get(url)
      .pipe(
        take(1),
        catchError((error) => {
          console.log(error);
          // no recibimos respuesta del servidor porque no existe
          if (error.status === 0) {
            const warning: Warning = {
              type: 'visualLayer',
              visible: true,
            };

            this.checkAddWarning(warning, warns, informe.id);
          } else {
            // si recibimos respuesta del servidor, es que existe la capa
            // y eliminamos la alerta antigua si la hubiera
            this.checkOldWarnings('visualLayer', warns, informe.id);
          }

          return [];
        }),
        take(1)
      )
      .subscribe((data) => console.log(''));

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkThermalLayer(informe: InformeInterface, warns: Warning[]): boolean {
    const url = this.geoserverService.getGeoserverUrl(informe, 'thermal', true);

    this.http
      .get(url)
      .pipe(
        take(1),
        catchError((error) => {
          console.log(error);
          // no recibimos respuesta del servidor porque no existe
          if (error.status === 0) {
            const warning: Warning = {
              type: 'thermalLayer',
              visible: true,
            };

            this.checkAddWarning(warning, warns, informe.id);
          } else {
            // si recibimos respuesta del servidor, es que existe la capa
            // y eliminamos la alerta antigua si la hubiera
            this.checkOldWarnings('thermalLayer', warns, informe.id);
          }

          return [];
        }),
        take(1)
      )
      .subscribe((data) => console.log(''));

    // confirmamos que ha sido checkeado
    return true;
  }

  private checkImagePortada(informeId: string, warns: Warning[]): boolean {
    this.storage
      .ref(`informes/${informeId}/portada.jpg`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        // eliminamos la alerta antigua si la hubiera
        this.checkOldWarnings('imgPortada', warns, informeId);
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

  private checkImageSuciedad(informeId: string, warns: Warning[]): boolean {
    this.storage
      .ref(`informes/${informeId}/suciedad.jpg`)
      .getDownloadURL()
      .toPromise()
      .then((url) => {
        // eliminamos la alerta antigua si la hubiera
        this.checkOldWarnings('imgSuciedad', warns, informeId);
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

  private checkTempMaxAnomsError(anomalias: Anomalia[], warns: Warning[], informeId: string): boolean {
    if (anomalias.length > 0) {
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
        this.checkOldWarnings('tempMaxAnoms', warns, informeId);
      }
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarnings('tempMaxAnoms', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }

  checkSegsRepeatName(segs: Seguidor[], warns: Warning[], informeId: string) {
    const repeatNameSegs = UtilitiesService.findDuplicates(segs.map((seg) => seg.nombre));

    if (repeatNameSegs.length > 0) {
      console.log('Seguidores con el mismo nombre: ' + repeatNameSegs.join(' | '));

      const warning: Warning = {
        type: 'segsRepeatName',
        visible: true,
      };

      this.checkAddWarning(warning, warns, informeId);
    } else {
      // eliminamos la alerta antigua si la hubiera
      this.checkOldWarnings('zonasRepeat', warns, informeId);
    }

    // confirmamos que ha sido checkeado
    return true;
  }
}
