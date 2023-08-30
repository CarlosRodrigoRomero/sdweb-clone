import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { InformeInterface } from '@core/models/informe';

import { PlantaInterface } from '@core/models/planta';

export interface PlantData {
  nombre: string;
  potencia: number;
  mae: number;
  variacionMae: number;
  gravedadMae: string;
  perdidas: number;
  variacionPerdidas: number;
  ultimaInspeccion: number;
  cc: number;
  variacionCC: number;
  gravedadCC: string;
  informesAntiguos?: InformeInterface[];
  plantaId?: string;
  tipo?: string;
  warnings?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DemoService {
  plantaId = 'egF0cbpXnnBnjcrusoeR';
  informesId = ['vfMHFBPvNFnOFgfCgM9L', '4ruzdxY6zYxvUOucACQ0'];
  visualLayer = 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png';
  demoGIS = 'https://solardrontech.es/demo_rgb/';
  pdf =
    'https://firebasestorage.googleapis.com/v0/b/sdweb-d33ce.appspot.com/o/informes%2FvfMHFBPvNFnOFgfCgM9L%2Finforme.pdf?alt=media&token=95627352-546e-4a91-b19d-8cc5ec39b2cb';

  constructor(private router: Router) {}

  addPlantasFake(plantas: PlantaInterface[]) {
    const plantasFake: PlantaInterface[] = [
      {
        id: '01',
        nombre: 'Planta 1',
        potencia: 11.06,
        latitud: 38.36439,
        longitud: -1.27652,
        tipo: 'fija',
        informes: [
          {
            id: '01_1',
            plantaId: '01',
            mae: 0.0742,
            fixablePower: 0.051,
            cc: 0.032,
            fecha: 1624270070,
            disponible: true,
          },
          {
            id: '01_2',
            plantaId: '01',
            mae: 0.063,
            fixablePower: 0.05,
            cc: 0.028,
            fecha: 1594047573,
            disponible: true,
          },
        ],
      },
      {
        id: '02',
        nombre: 'Planta 2',
        potencia: 2.81,
        latitud: 42,
        longitud: -1.5,
        tipo: 'seguidores',
        informes: [
          {
            id: '02_1',
            plantaId: '02',
            mae: 0.0947,
            fixablePower: 0.084,
            cc: 0.034,
            fecha: 1625737808,
            disponible: true,
          },
          {
            id: '02_2',
            plantaId: '02',
            mae: 0.056,
            fixablePower: 0.043,
            cc: 0.039,
            fecha: 1594911573,
            disponible: true,
          },
        ],
      },
      {
        id: '03',
        nombre: 'Planta 3',
        potencia: 6.19,
        latitud: 41.5,
        longitud: -6,
        tipo: 'fija',
        informes: [
          {
            id: '03_1',
            plantaId: '03',
            mae: 0.0318,
            fixablePower: 0.029,
            cc: 0.0102,
            fecha: 1625824208,
            disponible: true,
          },
          {
            id: '03_2',
            plantaId: '03',
            mae: 0.019,
            fixablePower: 0.015,
            cc: 0.0106,
            fecha: 1587049173,
            disponible: true,
          },
        ],
      },
      {
        id: '04',
        nombre: 'Planta 4',
        potencia: 2.27,
        latitud: 37.5,
        longitud: -4,
        tipo: 'seguidores',
        informes: [
          {
            id: '04_1',
            plantaId: '04',
            mae: 0.0767,
            fixablePower: 0.06,
            cc: 0.059,
            fecha: 1625910608,
            disponible: true,
          },
          {
            id: '04_2',
            plantaId: '04',
            mae: 0.016,
            fixablePower: 0.011,
            cc: 0.064,
            fecha: 1597417173,
            disponible: true,
          },
        ],
      },
      {
        id: '05',
        nombre: 'Planta 5',
        potencia: 1.84,
        latitud: 40,
        longitud: -4,
        tipo: 'fija',
        informes: [
          {
            id: '05_1',
            plantaId: '05',
            mae: 0.0882,
            fixablePower: 0.074,
            cc: 0.078,
            fecha: 1626083408,
            disponible: true,
          },
          {
            id: '05_2',
            plantaId: '05',
            mae: 0.032,
            fixablePower: 0.023,
            cc: 0.069,
            fecha: 1597071573,
            disponible: true,
          },
        ],
      },
      {
        id: '06',
        nombre: 'Planta 6',
        potencia: 7.25,
        latitud: 42.5,
        longitud: -6,
        tipo: 'fija',
        informes: [
          {
            id: '06_1',
            plantaId: '06',
            mae: 0.0183,
            fixablePower: 0.015,
            cc: 0.036,
            fecha: 1626083408,
            disponible: true,
          },
          {
            id: '06_2',
            plantaId: '06',
            mae: 0.052,
            fixablePower: 0.032,
            cc: 0.031,
            fecha: 1599145173,
            disponible: true,
          },
        ],
      },
      {
        id: '07',
        nombre: 'Planta 7',
        potencia: 2,
        latitud: 40,
        longitud: -5,
        tipo: 'seguidores',
        informes: [
          {
            id: '07_1',
            plantaId: '07',
            mae: 0.0621,
            fixablePower: 0.045,
            cc: 0.019,
            fecha: 1626083408,
            disponible: true,
          },
          {
            id: '07_2',
            plantaId: '07',
            mae: 0.031,
            fixablePower: 0.023,
            cc: 0.009,
            fecha: 1589900373,
            disponible: true,
          },
        ],
      },
      {
        id: '08',
        nombre: 'Planta 8',
        potencia: 2.27,
        latitud: 42,
        longitud: -3,
        tipo: 'seguidores',
        informes: [
          {
            id: '08_1',
            plantaId: '08',
            mae: 0.0546,
            fixablePower: 0.032,
            cc: 0.036,
            fecha: 1626083408,
            disponible: true,
          },
          {
            id: '08_2',
            plantaId: '08',
            mae: 0.029,
            fixablePower: 0.023,
            cc: 0.029,
            fecha: 1595257173,
            disponible: true,
          },
        ],
      },
      {
        id: '09',
        nombre: 'Planta 9',
        potencia: 10.87,
        latitud: 41,
        longitud: -2,
        tipo: 'fija',
        informes: [
          {
            id: '09_1',
            plantaId: '09',
            mae: 0.0114,
            fixablePower: 0.012,
            cc: 0.045,
            fecha: 1626083408,
            disponible: true,
          },
          {
            id: '09_2',
            plantaId: '09',
            mae: 0.036,
            fixablePower: 0.032,
            cc: 0.043,
            fecha: 1593356373,
            disponible: true,
          },
        ],
      },
      {
        id: '10',
        nombre: 'Planta 10',
        potencia: 2.27,
        latitud: 39,
        longitud: -1.5,
        tipo: 'seguidores',
        informes: [
          {
            id: '10_1',
            plantaId: '10',
            mae: 0.0508,
            fixablePower: 0.042,
            cc: 0.016,
            fecha: 1624226400,
            disponible: true,
          },
          {
            id: '10_2',
            plantaId: '10',
            mae: 0.02,
            fixablePower: 0.013,
            cc: 0.011,
            fecha: 1595948373,
            disponible: true,
          },
        ],
      },
      {
        id: '11',
        nombre: 'Planta 11',
        potencia: 2.27,
        latitud: 38,
        longitud: -2,
        tipo: 'seguidores',
        informes: [
          {
            id: '11_1',
            plantaId: '11',
            mae: 0.0308,
            fixablePower: 0.031,
            cc: 0.033,
            fecha: 1626083408,
            disponible: true,
          },
          {
            id: '11_2',
            plantaId: '11',
            mae: 0.0402,
            fixablePower: 0.032,
            cc: 0.029,
            fecha: 1595948373,
            disponible: true,
          },
        ],
      },
      {
        id: '12',
        nombre: 'Planta 12',
        potencia: 3.48,
        latitud: 39,
        longitud: -4,
        tipo: 'fija',
        informes: [
          {
            id: '12_1',
            plantaId: '12',
            mae: 0.0415,
            fixablePower: 0.041,
            cc: 0.016,
            fecha: 1625910608,
            disponible: true,
          },
          {
            id: '12_2',
            plantaId: '12',
            mae: 0.0482,
            fixablePower: 0.032,
            cc: 0.023,
            fecha: 1595948373,
            disponible: true,
          },
        ],
      },
    ];

    plantasFake.forEach((fake) => {
      plantas.push(fake);
    });

    return plantas;
  }

  changeNameOlmedilla(plantas: PlantaInterface[]): PlantaInterface[] {
    plantas.forEach((planta) => {
      if (planta.id === 'qa8Uc1yQ12fm2ndT2VgD') {
        planta.nombre = 'Planta Demo';
      }
    });

    return plantas;
  }

  addFakeWarnings(plantsData: PlantData) {
    const warnings: string[] = [];
    if (plantsData.nombre === 'Planta 1') {
      warnings.push('3476 módulos en circuito abierto (string)');
      warnings.push('446 módulos con 1x diodo en circuito abierto');
      warnings.push('63% de anomalías en la fila 1 (más alejada del suelo)');

      plantsData.warnings = warnings;
    }
    if (plantsData.nombre === 'Planta 2') {
      warnings.push('587 módulos afectados por sombras');

      plantsData.warnings = warnings;
    }
    if (plantsData.nombre === 'Planta 3') {
      warnings.push('573 módulos en circuito abierto (string)');
      warnings.push('147 módulos con 1x diodo en circuito abierto');
      warnings.push('6 módulos con células calientes con gradiente mayor de 40ºC');

      plantsData.warnings = warnings;
    }
    if (plantsData.nombre === 'Demo') {
      warnings.push('17 módulos en circuito abierto (string)');
      warnings.push('2 módulos con 1x diodo en circuito abierto');
      warnings.push('4 módulos con células calientes con gradiente mayor de 40ºC');

      plantsData.warnings = warnings;
    }

    return plantsData;
  }

  checkIsDemo(): boolean {
    const currentPlantaId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    if (currentPlantaId === this.plantaId) {
      return true;
    }

    return false;
  }
}
