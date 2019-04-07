export let GLOBAL = {
  url: 'http://localhost:3977/api',
  num_tipos: 14,
  perdidas_tipo: [0.01, 0.03, 0.33, 0, 1, 0.33, 0.1, 0.01, 0.04],
  camaraTermica: 'DJI XT2 640 13mm (Numero de serie: 297106)',
  ultimaCalibracion: 'Enero 2019',
  uav: 'Multirrotor Solardrone MKIV',
  mae: [0.1, 0.2],
  resolucionCamara: [512, 640],
  // labels_severidad: ['Leve', 'Media', 'Grave'],
  labels_severidad: ['CoA 1', 'CoA 2', 'CoA 3'],
  descripcionSeveridad: [
    'Tipo 1: sin anomalía. Hacemos seguimiento, pero no hay que actuar',
    'Tipo 2: anomalía térmica: ver la causa y, si es necesario, arreglar en un periodo razonable.',
    'Tipo 3: anomalía relevante para la seguridad: próxima interrupción de la operación normal del módulo, actuar cuanto antes.'
  ],
  tipos_severidad: [1, 2, 3],
  // colores_severidad: ['#20B2AA', '#FFD700', '#FF4500', '#800000'],
  colores_severidad: ['#20B2AA', '#FF4500', '#b70000'],
  labels_tipos: ['0', 'PC', 'VPV', 'Substring en CA', 'String', 'MOD. CA', 'Substring CC',
                'MOD. CC', 'CC', 'VCC', '2X substring en CA', 'Células calientes debido a suciedad',
                'BRK', 'Transfer resistance', 'Caja de conexiones caliente'],
  severidad_dt: [5, 20, 40],
  pcDescripcion: [
    '0',
    'Punto caliente', // 1
    'Varios puntos calientes', // 2
    'Substring en CA', // 3
    'String en CA', // 4
    'Módulo en CA', // 5
    'Substring en CC', // 6
    'Módulo en CC', // 7
    'Célula caliente', // 8
    'Varias células calientes', // 9
    '2X substring en CA', // 10
    'Células calientes debido a suciedad', // 11
    'Vidrio roto', // 12
    'Transfer resistance', // 13
    'Caja de conexiones caliente' // 14
  ],
  //   '0',
  //   'Célula caliente',
  //   'Varias células calientes',
  //   'Substring del módulo en circuito abierto',
  //   'Módulos en circuito abierto',
  //   '2 Substrings en CA',
  //   'Substring en CC',
  //   'Rotura en vidrio'
  pcCausa: [
    '0',
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en daño un irreversible en la célula, aislamiento o diodo bypass.',
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en daño un irreversible en la célula, aislamiento o diodo bypass.',
    'Problema de conexión entre células o diodo bypass defectuoso.',
    'Distintas causas, seguir recomendaciones. Podría conducir a un arco en serie visible en la superficie posterior del módulo.',
    'Problema de conexión entre células o diodo bypass defectuoso. Puede derivar en un arco en serie visible en la superficie posterior del módulo.',
    'Diodo bypass defectuoso.',
    'Posible impacto o defecto de fabricación.',
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en daño un irreversible en la célula, aislamiento o diodo bypass.',
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en daño un irreversible en la célula, aislamiento o diodo bypass.',
    'Fallo en una conexion entre células o fallo del diodo bypass. Puede derivar en un arco visible en la superficie posterior del módulo.',
    'La suciedad habitual (tierra o deposiciones de pájaros) suelen desaparecer con la lluvia.',
    'Vidrio roto',
    'La temperatura aumenta con la carga de corriente causada por el aumento de resistencia eléctrica dentro de la caja de conexiones. Puede también ser causada por una cinta rota o un punto de soldadura defectuoso entre el conector transversal y la cinta.',
    'La temperatura aumenta con la carga de corriente causada por el aumento de resistencia eléctrica dentro de la caja de conexiones. Puede también ser causada por una cinta rota o un punto de soldadura defectuoso entre el conector transversal y la cinta.'
  ],
  pcRecomendacion: [
    '0',
    'Ver si no hay sombras o suciedad.',
    '',
    'Sustituir diodo bypass o arreglar defecto de conexiones.',
    'Revisar módulos, estado de operación del inversor, cableado, conectores y fusibles',
    'Cambiar el diodo bypass en caso de que se este el motivo.',
    'Revisar módulo y diodos bypass para un correcto funcionamiento con polaridad inversa.',
    'Tener en cuenta que el voltage aumenta debido a la pérdida de aislamiento.',
    'Reclamar a garantía en su caso.',
    'Reclamar a garantía en su caso.',
    'Cambiar el diodo bypass en caso de que se este el motivo.',
    'Se recomienda encarecidamente la limpieza del módulo si se estima que no va a llover pronto, con el fin de evitar daños al módulo.',
    'Tener cuidado con las subidas de voltaje debido a las pérdidas de aislamiento por altas temperaturas.',
    'Análisis en detalle por experto.',
    'Análisis en detalle por experto.'
  ],
  pcPerdidas: [
    '0',
    '3',
    '0',
    '33',
    '100',
    '66',
    '15',
    '15',
  ]
};
