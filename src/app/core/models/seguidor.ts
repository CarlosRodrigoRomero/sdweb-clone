import { Anomalia } from './anomalia';
import { FiltrableInterface } from './filtrableInterface';
import { LocationAreaInterface } from './location';
import { ModuloInterface } from './modulo';

export class Seguidor implements FiltrableInterface {
  // Filtrable Interface
  anomalias: Anomalia[];
  globalCoords: string[];
  perdidas: number; // sumatorio de perdidas de los modulos del seguidor
  temperaturaMax: number; // temperatura máxima en el seguidor
  modulo: ModuloInterface;
  //
  id?: string;
  mae: number; // modulos apagados equivalentes en el seguidor
  gradienteNormMax: number; // gradiente maximo en el seguidor
  plantaId?: string;
  informeId?: string;
  filas: number;
  columnas: number;
  locArea: LocationAreaInterface;

  constructor(anomalias: Anomalia[], filas: number, columnas: number, locArea: LocationAreaInterface) {
    this.anomalias = anomalias;
    this.plantaId = this.getPlantaId(this.anomalias[0]);
    this.informeId = this.anomalias[0].informeId;
    this.filas = filas;
    this.columnas = columnas;
    this.globalCoords = anomalias[0].globalCoords;
    this.perdidas = anomalias.reduce((acum, current) => acum + current.perdidas, 0);
    this.temperaturaMax = this.getTempMax();
    this.mae = this.getMae();
    this.gradienteNormMax = this.getGradienteNormMax();
    this.modulo = anomalias[0].modulo;
    this.locArea = locArea;
  }

  private getMae(): number {
    return this.perdidas / (this.filas * this.columnas);
  }

  private getTempMax(): number {
    return Math.max(...this.anomalias.map((anomalia) => anomalia.temperaturaMax));
  }

  private getGradienteNormMax(): number {
    return Math.max(...this.anomalias.map((anomalia) => anomalia.gradienteNormalizado));
  }

  private getPlantaId(anomalia: Anomalia): string {
    if (anomalia.plantaId !== undefined) {
      return anomalia.plantaId;
    } else {
      return undefined;
    }
  }
}
