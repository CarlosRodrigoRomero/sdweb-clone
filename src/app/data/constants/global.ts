export let GLOBAL = {
  // Roles:
  // 0: Empresa sin plantas en su user
  // 1: ADMIN
  // 2: Empresa con plantas en su user
  // 3: Estructuras
  // 4: Localizaciones
  // 5: Clasificación
  urlServidorAntiguo: 'https://solardrontech.es/tileserver.php?/index.json?/',
  url: 'http://localhost:3977/api',
  urlStorageInformes:
    'https://console.firebase.google.com/project/sdweb-d33ce/storage/sdweb-d33ce.appspot.com/files/~2Finformes',
  urlGeoserver: 'https://geoserver.solardrone.app:8081/geoserver/gwc/service/tms/1.0.0/sd:',
  num_tipos: 16,
  carpetaJpgGray: 'gray\\',
  temperaturaLimiteFabricantes: 90,
  filtroGradientePorDefecto: 10,
  minGradiente: 10,
  maxGradiente: 50,
  stringParaDesconocido: '-',
  stringConectorGlobalsDefault: '.',
  nombreGlobalXFija: 'C1',
  nombreGlobalYFija: 'Pasillo',
  nombreGlobalZFija: 'C3',
  nombreGlobalCoordsFija: ['C1', 'Pasillo', 'C3'],
  nombreGlobalCoordsSeguidores: ['C1', 'C2', 'Seguidor'],
  nombreLocalXFija: 'Columna',
  nombreLocalYFija: 'Altura',
  mae: [1, 2],
  mae_rangos: [0.0018, 0.0142],
  mae_rangos_labels: ['leve', 'moderado', 'grave'],
  cc_rangos: [0.02, 0.05],
  newReportsDate: 1619820000,
  newVisualLayerDate: 1654473600, // compienza el 6/06/2022
  anomaliaPorDefecto: 9,
  resolucionCamara: [512, 640],
  globalCoordsEstructura: [0, 1, 2],
  numGlobalCoords: 3,
  criterioCoA: {
    rangosDT: [10, 10, 40],
    siempreCoA2: [3, 6, 10, 12],
    siempreCoA3: [4, 5, 7, 17, 14, 18, 20, 21],
    siempreVisible: [15, 11, 13],
  },
  labels_clase: ['CoA 1', 'CoA 2', 'CoA 3'],
  descripcionClase: [
    'CoA 1: no es considerada una anomalía térmica. Hacemos seguimiento pero no hay que actuar.',
    'CoA 2: anomalía térmica: ver la causa y, si es necesario, arreglar en un periodo razonable.',
    'CoA 3: anomalía térmica relevante: posible interrupción de la operación normal del módulo, actuar en el corto plazo.',
  ],
  tipos_clase: [1, 2, 3],
  labels_criticidad: ['Muy baja', 'Baja', 'Media', 'Alta', 'Muy Alta'],
  tipos_criticidad: [1, 2, 3, 4, 5],
  tipos_no_utilizados: [0, 1, 2, 4, 13, 16],
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
    'PID fase temprana', // 18
    'Falta módulo', // 19
    'PID regular', // 20
    'PID irregular', // 21
  ],
  labels_bloqueadas: [0, 1, 2, 4, 16],
  pcDescripcion: [
    '0', // Para que coincida el indice con el tipo de anomalia
    'Punto caliente', // 1 - Nos
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
    'PID en fase temprana', // 18
    'Falta módulo', // 19
    'PID regular', // 20
    'PID irregular', // 21
  ],
  pcCausa: [
    '0', // 0
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en un daño irreversible en la célula, aislamiento o diodo bypass.', // 1
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en un daño irreversible en la célula, aislamiento o diodo bypass.', // 2
    'Diodo bypass actuando en el módulo. Puede ser debido a que una o varias células calientes están produciendo que el diodo se active. También puede ser debido a un problema de conexión entre células o diodo bypass defectuoso.', // 3
    'Los módulos que componen el string se encuentran a una temperatura varios grados superior a la temperatura normal de operación del módulo. Es posible que el string esté en circuito abierto.', // 4
    'Problema de conexión entre células o diodo bypass defectuoso. Puede derivar en un arco en serie visible en la superficie posterior del módulo.', // 5
    'Diodo bypass defectuoso.', // 6
    'Posible subida repentina de tensión o defecto de fabricación.', // 7
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en un daño irreversible en la célula, aislamiento o diodo bypass.', // 8
    'La diferencia de temperatura aumenta con la corriente. Normalmente causadas por células rotas. Puede derivar en un daño irreversible en la célula, aislamiento o diodo bypass.', // 9
    'Diodo bypass actuando en el módulo. Puede ser debido a que una o varias células calientes están produciendo que el diodo se active. También puede ser debido a un problema de conexión entre células o diodo bypass defectuoso.', // 10
    'La suciedad habitual (tierra o deposiciones de pájaros) suelen desaparecer con la lluvia.', // 11
    'Puede haber sido causado por una célula altas temperaturas.', // 12
    'Existe un calentamiento anómalo en una o varias de las de las conexiones entre células del módulo.', // 13
    'La temperatura aumenta con la carga de corriente causada por el aumento de resistencia eléctrica dentro de la caja de conexiones. Puede también ser causada por una cinta rota o un punto de soldadura defectuoso entre el conector transversal y la cinta.', // 14
    'Existe algún elemento que está provocando sombras que evitan el correcto funcionamiento del módulo o módulos afectados.', // 15
    'Suelen aparecer por defectos en la fabricación. No suele afectar al rendimiento del módulo.', // 16
    'Los módulos que componen el string se encuentran a una temperatura varios grados superior a la temperatura normal de operación del módulo. Es posible que el string esté en circuito abierto.', // 17
    'El módulo sufre de PID en fase temprana.', // 18
    'Falta el módulo en esta posición.', // 19
    'El módulo sufre de PID de tipo regular.', // 20
    'El módulo sufre de PID de tipo irregular.', // 21
  ],
  pcRecomendacion: [
    '0', // 0
    'Ver si no hay sombras o suciedad.', // 1
    '', // 2
    'Sustituir diodo bypass en su caso.', // 3
    'Revisar módulos, estado de operación del inversor, cableado, conectores y fusibles.', // 4
    'Revisar módulo en campo para determinar causa.', // 5
    'Revisar módulo y diodos bypass para un correcto funcionamiento con polaridad inversa.', // 6
    'Tener en cuenta que el voltage aumenta debido a la pérdida de aislamiento.', // 7
    'Reclamar a garantía en su caso.', // 8
    'Reclamar a garantía en su caso.', // 9
    'Cambiar el diodo bypass en caso de que sea este el motivo.', // 10
    'Se recomienda la limpieza del módulo si se estima que no va a llover pronto, con el fin de evitar daños al módulo.', // 11
    'Tener cuidado con las subidas de voltaje debido a las pérdidas de aislamiento por altas temperaturas.', // 12
    'Análisis en detalle por experto.', // 13
    'Análisis en detalle por experto.', // 14
    'Eliminación de la fuente de sombras.', // 15
    'Hacer seguimiento de le evolución.', // 16
    'Revisar módulos, estado de operación del inversor, cableado, conectores y fusibles.', // 17
    'Revisar módulos.', // 18
    '', // 19
    'Revisar módulos.', // 20
    'Revisar módulos.', // 21
  ],
  pcPerdidas: [
    0, // Para que coincida el indice con el tipo de anomalia
    0, // "Punto caliente", // 1
    0, // "Varios puntos calientes", // 2
    0.33, // "Substring en CA", // 3
    0, // "String", // 4
    1, // "Módulo en CA", // 5
    0.33, // "Substring en CC", // 6
    0.85, // "Módulo en CC", // 7
    0.02, // "Célula caliente", // 8
    0.03, // "Varias células calientes", // 9
    0.66, // "2X substring en CA", // 10
    0.02, // "Células calientes debido a suciedad", // 11
    0.85, // "Vidrio roto", // 12
    0, // "Transfer resistance", // 13
    0, // "Caja de conexiones caliente", // 14
    0.02, // "Módulo afectado por sombras" // 15
    0, // Yellowing //16
    1, // "String en CA", // 17
    0.05, // "PID fase temprana" // 18
    0, // Falta modulo // 19
    0.55, // PID regular // 20
    0.2, // PID irregular // 21
  ],
  sortedAnomsTipos: [
    20, // PID regular
    21, // PID irregular
    18, // 'PID fase temprana'
    17, // 'Módulo en CA (string)'
    4, // 'String'
    5, // 'Módulo en CA'
    10, // '2x Substring CA'
    3, // 'Substring en CA'
    7, // 'Módulo en CC'
    6, // 'Substring en CC'
    12, // 'Vidrio roto'
    13, // 'Resist. anómala'
    14, // 'Caja conexiones'
    19, // 'Falta módulo'
    16, // 'Yellowing'
    9, // 'Varias células'
    8, // 'Célula'
    11, // 'Suciedad'
    15, // 'Sombras'
    2, // 'VPV'
    1, // 'PC'
    0, // '0'
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
  columnasAnomPdf: [
    // { nombre: 'local_id', descripcion: '#ID' },
    { nombre: 'severidad', descripcion: 'Clase (CoA)' },
    { nombre: 'criticidad', descripcion: 'Criticidad' },
    { nombre: 'tipo', descripcion: 'Categoría' },
    // { nombre: "local_x", descripcion: "Columna" },
    // { nombre: "local_y", descripcion: "Fila" },
    { nombre: 'local_xy', descripcion: 'Fila/Columna' },
    { nombre: 'temperaturaMax', descripcion: 'Tª Máx' },
    {
      nombre: 'gradienteNormalizado',
      descripcion: 'Grad Tª Norm',
    },
    // { nombre: "archivoPublico", descripcion: "Nombre archivo" },
    // { nombre: 'irradiancia', descripcion: 'Irradiancia' },
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
