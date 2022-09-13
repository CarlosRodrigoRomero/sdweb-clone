import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';

export class Patches {
  static checkId(id: string): boolean {
    const informesIds: string[] = ['cAX7f55nKEQBzx7RcROI'];
    const plantasIds: string[] = ['AyKgsY6F3TqGQGYNaOUY'];

    if (informesIds.includes(id) || plantasIds.includes(id)) {
      return true;
    }
    return false;
  }

  static applyPatches(id: string, data?: any): any {
    switch (id) {
      // Casas de Don Pedro 2022
      case 'cAX7f55nKEQBzx7RcROI':
        const anomalia = data as Anomalia;
        if (anomalia.temperaturaMax === 0) {
          anomalia.temperaturaMax = 53.4;
          anomalia.temperaturaRef = 45.8;
          anomalia.gradienteNormalizado = 7.6;
        }
        return anomalia;
      // Logrosan
      case 'AyKgsY6F3TqGQGYNaOUY':
        const zoomLevel = 20;
        return zoomLevel;
      // Berenis 1 y 2 2022
      case 'GjlYrwpyZizqXSw4sSTa':
        const dateBerenis1 = '16/08/2022 13:00:00';
        return dateBerenis1;
      case 'b7LlgJYacx6CRyt0DIuF':
        const dateBerenis2 = '16/08/2022 13:00:00';
        return dateBerenis2;
      default:
        return undefined;
    }
  }

  static plantsTwoClients(plantaId: string, userId: string, informes: InformeInterface[]): InformeInterface[] {
    const empresasPlantasCompradas = informes
      .filter((informe) => informe.hasOwnProperty('empresaId'))
      .map((informe) => informe.empresaId)
      .flat();

    let informesCliente = informes;
    if (empresasPlantasCompradas.length > 0) {
      const informesPlantasCompradas = informes.filter((informe) => informe.hasOwnProperty('empresaId'));
      if (empresasPlantasCompradas.includes(userId)) {
        informesCliente = informesPlantasCompradas.filter((informe) => informe.empresaId.includes(userId));
      } else {
        informesCliente = informes.filter((informe) => !informe.hasOwnProperty('empresaId'));
      }
    }

    return informesCliente;
  }
}
