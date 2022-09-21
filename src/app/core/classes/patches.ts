import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';

export class Patches {
  static checkId(id: string): boolean {
    const informesIds: string[] = ['cAX7f55nKEQBzx7RcROI'];
    const plantasIds: string[] = [
      'AyKgsY6F3TqGQGYNaOUY', // Logrosan
      'sXxGiOAlC2Gd5NGjTB0a', // Ecoinversion 1
      '5ie3jpW3vTZsWu4XuHP7', // Ecoinversion 2
      '0BLkUW2AKGXMoHn7WcTi', // Ecoinversion 3
      '84MscR4CrY1hHKAqhoZO', // Coronil (segs)
    ];

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
      case 'sXxGiOAlC2Gd5NGjTB0a': // Ecoinversion 1
        const zoomEco1 = 17;
        return zoomEco1;
      case '5ie3jpW3vTZsWu4XuHP7': // Ecoinversion 2
        const zoomEco2 = 17;
        return zoomEco2;
      case '0BLkUW2AKGXMoHn7WcTi': // Ecoinversion 3
        const zoomEco3 = 17;
        return zoomEco3;
      case '84MscR4CrY1hHKAqhoZO': // Coronil (segs)
        const zoomCoronil = 17;
        return zoomCoronil;
      default:
        return undefined;
    }
  }

  static plantsTwoClients(userId: string, informes: InformeInterface[]): InformeInterface[] {
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
