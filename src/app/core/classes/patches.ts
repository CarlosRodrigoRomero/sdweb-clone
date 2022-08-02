import { Anomalia } from '@core/models/anomalia';
import { InformeInterface } from '@core/models/informe';

export class Patches {
  static checkInformeId(informeId: string): boolean {
    const informesIds: string[] = ['cAX7f55nKEQBzx7RcROI'];

    if (informesIds.includes(informeId)) {
      return true;
    }
    return false;
  }

  static applyPatches(informeId: string, data: any): any {
    switch (informeId) {
      case 'cAX7f55nKEQBzx7RcROI':
        const anomalia = data as Anomalia;
        if (anomalia.temperaturaMax === 0) {
          anomalia.temperaturaMax = 53.4;
          anomalia.temperaturaRef = 45.8;
          anomalia.gradienteNormalizado = 7.6;
        }
        return anomalia;
    }
  }

  static plantsTwoClients(plantaId: string, userId: string, informes: InformeInterface[]): InformeInterface[] {
    const plantasCompradas = ['NJjVdM0e94vhHVfveaPh', 'G1m2tuoEaRtuiCHtcI7g']; // Carbonero, Martin Muñoz

    let informesCliente = informes;
    if (plantasCompradas.includes(plantaId)) {
      const pleniumId = '82gvWxNTFsb25E2gjSdk0ezPlnJ2';
      if (userId === pleniumId) {
        informesCliente = informes.filter((informe) => informe.empresaId === pleniumId);
      } else {
        informesCliente = informes.filter((informe) => !informe.hasOwnProperty('empresaId'));
      }
    }

    return informesCliente;
  }
}
