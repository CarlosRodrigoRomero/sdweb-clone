export let GLOBAL = {
  // Roles:
  // 0: Empresa sin plantas en su user
  // 1: ADMIN
  // 2: Empresa con plantas en su user
  // 3: Estructuras
  // 4: Localizaciones
  // 5: Clasificación

  url: 'http://localhost:3977/api',
  num_tipos: 16,
  camaraTermica: 'DJI XT2 640 13mm (Numero de serie: 297106)',
  ultimaCalibracion: '03/2020',
  carpetaJpgGray: 'gray\\',
  uav: 'DJI Matrice M200',
  temperaturaLimiteFabricantes: 90,
  filtroGradientePorDefecto: 10,
  minGradiente: 10,
  maxGradiente: 50,
  stringParaDesconocido: '-',
  stringConectorGlobalsDefault: '/',
  nombreGlobalXFija: 'C1',
  nombreGlobalYFija: 'Pasillo',
  nombreGlobalZFija: 'C3',
  nombreLocalXFija: 'Columna',
  nombreLocalYFija: 'Altura',
  mae: [0.1, 0.2],
  anomaliaPorDefecto: 9,
  resolucionCamara: [512, 640],
  globalCoordsEstructura: [0, 1, 2],
  numGlobalCoords: 3,
  // labels_severidad: ['Leve', 'Media', 'Grave'],
  labels_severidad: ['CoA 1', 'CoA 2', 'CoA 3'],
  descripcionSeveridad: [
    'CoA 1: no es considerada una anomalía térmica. Hacemos seguimiento pero no hay que actuar.',
    'CoA 2: anomalía térmica: ver la causa y, si es necesario, arreglar en un periodo razonable.',
    'CoA 3: anomalía térmica relevante: posible interrupción de la operación normal del módulo, actuar en el corto plazo.',
  ],
  tipos_severidad: [1, 2, 3],
  // colores_severidad: ['#20B2AA', '#FFD700', '#FF4500', '#800000'],
  colores_severidad: ['#20B2AA', '#FF4500', '#b70000'],
  labels_tipos: [
    '0',
    'PC',
    'VPV',
    'Substring en CA',
    'String',
    'Módulo en CA',
    'Substring en CC',
    'Módulo en CC',
    'Célula',
    'Varias células',
    '2x Substring CA', // nunca más largo que esto, por estética en tabla anexos
    'Suciedad',
    'Vidrio roto',
    'Resist. anómala',
    'Caja conexiones',
    'Sombras', // 15
    'Yellowing', // 16
    'Módulo en CA (string)', // 17
    'Posible PID', // 18
  ],
  labels_bloqueadas: [0, 1, 2, 4, 16],
  pcDescripcion: [
    '0', // Para que coincida el indice con el tipo de anomalia
    'Punto caliente', // 1
    'Varios puntos calientes', // 2
    'Substring en circuito abierto', // 3
    'String', // 4
    'Módulo en circuito abierto', // 5
    'Substring en cortocircuito', // 6
    'Módulo en cortocircuito', // 7
    'Célula caliente', // 8
    'Varias células calientes', // 9
    '2x substrings en circuito abierto', // 10
    'Células calientes debido a suciedad', // 11
    'Vidrio roto', // 12
    'Resistencia anómala', // 13
    'Caja de conexiones caliente', // 14
    'Módulo con sombras', // 15
    'Yellowing', // 16
    'Módulo en string con baja producción', // 17
    'Posible PID', // 18
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
    'Diodo bypass actuando en el módulo. Puede ser debido a que una o varias células calientes están produciendo que el diodo se active. También puede ser debido a un problema de conexión entre células o diodo bypass defectuoso.',
    'Los módulos que componen el string se encuentran a una temperatura varios grados superior a la temperatura normal de operación del módulo. Es posible que el string esté en circuito abierto.',
    'Problema de conexión entre células o diodo bypass defectuoso. Puede derivar en un arco en serie visible en la superficie posterior del módulo.',
    'Diodo bypass defectuoso.',
    'Posible subida repentina de tensión o defecto de fabricación.',
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en daño un irreversible en la célula, aislamiento o diodo bypass.',
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en daño un irreversible en la célula, aislamiento o diodo bypass.',
    'Diodo bypass actuando en el módulo. Puede ser debido a que una o varias células calientes están produciendo que el diodo se active. También puede ser debido a un problema de conexión entre células o diodo bypass defectuoso.',
    'La suciedad habitual (tierra o deposiciones de pájaros) suelen desaparecer con la lluvia.',
    'Puede haber sido causado por una célula altas temperaturas.',
    'Existe un calentamiento anómalo en una o varias de las de las conexiones entre células del módulo.',
    'La temperatura aumenta con la carga de corriente causada por el aumento de resistencia eléctrica dentro de la caja de conexiones. Puede también ser causada por una cinta rota o un punto de soldadura defectuoso entre el conector transversal y la cinta.',
    'Existe algún elemento que está provocando sombras que evitan el correcto funcionamiento del módulo o módulos afectados.',
    'Suelen aparecer por defectos en la fabricación. No suele afectar al rendimiento del módulo.',
    'Los módulos que componen el string se encuentran a una temperatura varios grados superior a la temperatura normal de operación del módulo. Es posible que el string esté en circuito abierto.',
    'Es posible que el módulo sufra de PID',
  ],
  pcRecomendacion: [
    '0',
    'Ver si no hay sombras o suciedad.',
    '',
    'Sustituir diodo bypass en su caso.',
    'Revisar módulos, estado de operación del inversor, cableado, conectores y fusibles',
    'Revisar módulo en campo para determinar causa.',
    'Revisar módulo y diodos bypass para un correcto funcionamiento con polaridad inversa.',
    'Tener en cuenta que el voltage aumenta debido a la pérdida de aislamiento.',
    'Reclamar a garantía en su caso.',
    'Reclamar a garantía en su caso.',
    'Cambiar el diodo bypass en caso de que sea este el motivo.',
    'Se recomienda la limpieza del módulo si se estima que no va a llover pronto, con el fin de evitar daños al módulo.',
    'Tener cuidado con las subidas de voltaje debido a las pérdidas de aislamiento por altas temperaturas.',
    'Análisis en detalle por experto.',
    'Análisis en detalle por experto.',
    'Eliminación de la fuente de sombras',
    'Hacer seguimiento de le evolución',
    'Revisar módulos, estado de operación del inversor, cableado, conectores y fusibles',
    'Revisar módulos',
  ],
  pcPerdidas: [
    0, // Para que coincida el indice con el tipo de anomalia
    0, // "Punto caliente", // 1
    0, // "Varios puntos calientes", // 2
    0.35, // "Substring en CA", // 3
    0, // "String", // 4
    1, // "Módulo en CA", // 5
    0.35, // "Substring en CC", // 6
    0.85, // "Módulo en CC", // 7
    0, // "Célula caliente", // 8
    0, // "Varias células calientes", // 9
    0.75, // "2X substring en CA", // 10
    0, // "Células calientes debido a suciedad", // 11
    0.85, // "Vidrio roto", // 12
    0, // "Transfer resistance", // 13
    0, // "Caja de conexiones caliente", // 14
    0, // "Módulo afectado por sombras" // 15
    0, // Yellowing //16
    1, // "String en CA", // 17
    0,
  ],

  pcColumnas: [
    { nombre: 'local_id', descripcion: '#ID' },
    { nombre: 'severidad', descripcion: 'Clase (CoA)' },
    { nombre: 'tipo', descripcion: 'Categoría' },
    // { nombre: "local_x", descripcion: "Columna" },
    // { nombre: "local_y", descripcion: "Fila" },
    { nombre: 'local_xy', descripcion: 'Fila/Columna' },
    { nombre: 'temperaturaMax', descripcion: 'Temp. máx' },
    {
      nombre: 'gradienteNormalizado',
      descripcion: 'Gradiente normalizado',
    },
    // { nombre: "archivoPublico", descripcion: "Nombre archivo" },
    { nombre: 'irradiancia', descripcion: 'Irradiancia' },
    // { nombre: "viento", descripcion: "Viento" },
    // { nombre: "temperaturaAire", descripcion: "Temp. ambiente (ºC)" },
    // { nombre: "datetimeString", descripcion: "Fecha/hora" }
  ],

  columnasAnexoSeguidor: [
    'datetimeString',
    'irradiancia',
    'temperaturaAire',
    'viento',
    'emisividad',
    'temperaturaReflejada',
  ],
  columnasExcluirCSV: [
    'color',
    'archivo',
    'distancia',
    'id',
    'image_rotation',
    'resuelto',
    'vuelo',
    'informeId',
    'img_width',
    'img_height',
    'rangeMin',
    'rangeMax',
    'datetime',
    'img_top',
    'img_left',
    'refTop',
    'refWidth',
    'refLeft',
    'refHeight',
  ],
  criterioSolardroneId: 'ZHSp2yNdpORe3XMDAxoA',
};
