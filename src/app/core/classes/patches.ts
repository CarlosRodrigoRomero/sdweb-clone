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
    const plantasCompradas = ['3JXI01XmcE3G1d4WNMMd'];

    let informesCliente = informes;
    if (plantasCompradas.includes(plantaId)) {
      const pleniumId = '7OB3WwV744cYZ4P6v9TURwSgarr2';
      if (userId === pleniumId) {
        informesCliente = informes.filter((informe) => informe.empresaId !== pleniumId);
      } else {
        informesCliente = informes.filter((informe) => !informe.hasOwnProperty('empresaId'));
      }
    }

    return informesCliente;
  }
}
