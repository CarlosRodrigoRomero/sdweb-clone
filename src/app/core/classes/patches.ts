import { Anomalia } from '@core/models/anomalia';

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
    }
  }
}
