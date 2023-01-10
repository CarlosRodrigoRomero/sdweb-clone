import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';

export class Patches {
  static checkId(id: string): boolean {
    const informesIds: string[] = [
      'cAX7f55nKEQBzx7RcROI', // Casas de Don Pedro 2022
      'RJh4Kfbg116FECvAMfgx', // Alqueva 2022
    ];
    const plantasIds: string[] = [
      'AyKgsY6F3TqGQGYNaOUY', // Logrosan
    ];

    if (informesIds.includes(id) || plantasIds.includes(id)) {
      return true;
    }
    return false;
  }

  static applyPatches(id: string, data?: any): any {
    const anomalia = data as Anomalia;
    switch (id) {
      // CasasdeDonPedro22
      case 'cAX7f55nKEQBzx7RcROI':
        if (anomalia.temperaturaMax === 0) {
          anomalia.temperaturaMax = 53.4;
          anomalia.temperaturaRef = 45.8;
          anomalia.gradienteNormalizado = 7.6;
        }
        return anomalia;
      // Alqueva Jun22
      case 'RJh4Kfbg116FECvAMfgx':
        anomalia.irradiancia = 750;
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

  static thermalTempsPatchs(informeId: string, tempMin: number, tempMax: number): number[] {
    // PARCHE PARA SIRUELA MAYO 2022
    if (informeId === 'M3PTkSUQfjPEd898haeR') {
      tempMin = tempMin + 15;
      tempMax = tempMax + 15;
    }
    // PARCHE VILLAROBLEDO 1 NOVIEMBRE 2021
    if (informeId === 'm61ebnPfzPqqS5xWm7sy') {
      tempMax = 100;
    }
    // PARCHE VERAZCRUZ MAYO 2022
    if (informeId === 'PC8PsQ34puUxRhSaj2KA') {
      tempMin = 30;
      tempMax = 75;
    }
    // PARCHE BARBASTRO MAYO 2022
    if (informeId === 'lR4PzmBML80tIFSKwSbT') {
      tempMin = 30;
      tempMax = 75;
    }
    // PARCHE HOYA VICENTES OCTUBRE 2021
    if (informeId === 'bopuGnf8J50NYeQtyVS1') {
      tempMin = 35;
      tempMax = 70;
    }
    // PARCHE LAS CABEZAS NOVIEMBRE 2021
    if (informeId === '1Ki3mmSzeh93S5PRGzQo') {
      tempMin = 30;
      tempMax = 50;
    }
    // PARCHE AEROPUERTO DE MURCIA DIC 2022
    if (informeId === '0Y5xLCfdDKjLkUJaaVIy') {
      tempMin = 20;
      tempMax = 60;
    }

    return [tempMin, tempMax];
  }
}
