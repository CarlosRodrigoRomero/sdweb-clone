import { Anomalia } from '@core/models/anomalia';

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
}
