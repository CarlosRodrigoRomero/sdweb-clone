import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Warning, warnings } from '@shared/components/warnings-menu/warnings';
import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';

@Injectable({
  providedIn: 'root',
})
export class WarningService {
  constructor(private afs: AngularFirestore) {}

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

  checkTiposAnoms(informe: InformeInterface, anomalias: Anomalia[], warns: Warning[]) {
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
  }

  checkNumsCoA(informe: InformeInterface, anomalias: Anomalia[], warns: Warning[]) {
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
  }

  checkNumsCriticidad(informe: InformeInterface, anomalias: Anomalia[], warns: Warning[]) {
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
  }

  checkFilsColsPlanta(planta: PlantaInterface, informe: InformeInterface, warns: Warning[]) {
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
  }
}
