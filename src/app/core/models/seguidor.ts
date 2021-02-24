import { Anomalia } from './anomalia';
import { FiltrableInterface } from './filtrableInterface';
import { ModuloInterface } from './modulo';

export class Seguidor implements FiltrableInterface {
  // Filtrable Interface
  anomalias: Anomalia[];
  globalCoords: string[];
  perdidas: number; // sumatorio de perdidas de los modulos del seguidor
  temperaturaMax: number; // temperatura máxima en el seguidor
  modulo: ModuloInterface;
  //
  mae: number; // modulos apagados equivalentes en el seguidor
  gradienteNormMax: number; // gradiente maximo en el seguidor
  plantaId?: string;
  informeId?: string;
  filas: number;
  columnas: number;

  constructor(anomalias: Anomalia[], filas: number, columnas: number) {
    this.anomalias = anomalias;
    this.plantaId = this.anomalias[0].plantaId;
    this.informeId = this.anomalias[0].informeId;
    this.filas = filas;
    this.columnas = columnas;
    this.globalCoords = anomalias[0].globalCoords;
    this.perdidas = anomalias.reduce((acum, current) => acum + current.perdidas, 0);
    this.temperaturaMax = this.getTempMax();
    this.mae = this.getMae();
    this.gradienteNormMax = this.getGradienteNormMax();
    this.modulo = anomalias[0].modulo;
  }

  private getMae(): number {
    return this.perdidas / (this.filas * this.columnas);
  }

  private getTempMax(): number {
    return Math.max(...this.anomalias.map((anomalia) => anomalia.temperaturaMax));
  }
  getGradienteNormMax(): number {
    return Math.max(...this.anomalias.map((anomalia) => anomalia.gradienteNormalizado));
  }
}
