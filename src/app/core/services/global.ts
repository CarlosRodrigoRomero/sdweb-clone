export let GLOBAL = {
  // Roles:
  // 0: Empresa sin plantas en su user
  // 1: ADMIN
  // 2: Empresa con plantas en su user
  // 3: Estructuras
  // 4: Localizaciones
  // 5: Clasificación
  gris: '#546e7a',
  GIS: 'https://solardrontech.es/tileserver.php?/index.json?/',
  colores_mae: ['#00e396', '#FF8A00', '#fd504d'], // verde, naranja, rojo
  color_rojo_interfaz: '#d32f2f', // red 700 material
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
    'Falta módulo', // 19
  ],
  colores_tipos_hex: [
    'rgba(0, 0, 0, 1)', // '0',
    'rgba(0, 200, 0)', // 'PC',
    'rgba(0, 135, 0)', // 'VPV',
    '#feb019', // 'Substring en CA',
    'rgba(255, 0, 0,1)', // 'String',
    'rgba(255, 112, 112,1)', // 'Módulo en CA',
    'rgba(220, 255, 0,1)', // 'Substring en CC',
    'rgba(170, 100, 0,1)', // 'Módulo en CC',
    '#00e396', // 'Célula',
    '#128254', // 'Varias células',
    '#ffc800', // '2x Substring CA', // 10nunca más largo que esto, por estética en tabla anexos
    'rgba(170, 0, 255,1)', // 'Suciedad',
    'rgba(0, 0, 0,1)', // 'Vidrio roto',
    'rgba(0, 190, 190,1)', // 'Resist. anómala',
    'rgba(40, 0, 240,1)', // 'Caja conexiones',
    'rgba(170, 0, 255,1)', // 'Sombras', // 15
    'rgba(255, 255, 255,1)', // 'Yellowing', // 16
    '#fd504d', // 'Módulo en CA (string)', // 17
    'rgba(255, 255, 255,1)', // 'Posible PID', // 18
    'rgba(196, 196, 196,1)', // 'Falta módulo', // 19
  ],
  colores_tipos: [
    'rgba(0, 0, 0, 1)', // '0',
    'rgba(0, 200, 0)', // 'PC',
    'rgba(0, 135, 0)', // 'VPV',
    'rgba(254, 176, 25,1)', // 'Substring en CA',
    'rgba(255, 0, 0,1)', // 'String',
    'rgba(255, 112, 112,1)', // 'Módulo en CA',
    'rgba(220, 255, 0,1)', // 'Substring en CC',
    'rgba(170, 100, 0,1)', // 'Módulo en CC',
    'rgba(0, 227, 150, 1)', // 'Célula',
    'rgba(18, 130, 84, 1)', // 'Varias células',
    'rgba(255, 200, 0,1)', // '2x Substring CA', // nunca más largo que esto, por estética en tabla anexos
    'rgba(170, 0, 255,1)', // 'Suciedad',
    'rgba(0, 0, 0,1)', // 'Vidrio roto',
    'rgba(0, 190, 190,1)', // 'Resist. anómala',
    'rgba(40, 0, 240,1)', // 'Caja conexiones',
    'rgba(170, 0, 255,1)', // 'Sombras', // 15
    'rgba(255, 255, 255,1)', // 'Yellowing', // 16
    'rgba(255, 0, 0,1)', // 'Módulo en CA (string)', // 17
    'rgba(255, 255, 255,1)', // 'Posible PID', // 18
    'rgba(196, 196, 196,1)', // 'Falta módulo', // 19
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
    'Posible PID', // 18
    'Falta módulo', // 19
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
  ironPalette: [
    [0, 0, 10],
    [0, 0, 20],
    [0, 0, 30],
    [0, 0, 37],
    [0, 0, 42],
    [0, 0, 46],
    [0, 0, 50],
    [0, 0, 54],
    [0, 0, 58],
    [0, 0, 62],
    [0, 0, 66],
    [0, 0, 70],
    [0, 0, 74],
    [0, 0, 79],
    [0, 0, 82],
    [1, 0, 85],
    [1, 0, 87],
    [2, 0, 89],
    [2, 0, 92],
    [3, 0, 94],
    [4, 0, 97],
    [4, 0, 99],
    [5, 0, 101],
    [6, 0, 103],
    [7, 0, 105],
    [8, 0, 107],
    [9, 0, 110],
    [10, 0, 112],
    [11, 0, 115],
    [12, 0, 116],
    [13, 0, 117],
    [13, 0, 118],
    [14, 0, 119],
    [16, 0, 120],
    [18, 0, 121],
    [19, 0, 123],
    [21, 0, 124],
    [23, 0, 125],
    [25, 0, 126],
    [27, 0, 128],
    [28, 0, 129],
    [30, 0, 131],
    [32, 0, 132],
    [34, 0, 133],
    [36, 0, 134],
    [38, 0, 135],
    [40, 0, 137],
    [42, 0, 137],
    [44, 0, 138],
    [46, 0, 139],
    [48, 0, 140],
    [50, 0, 141],
    [52, 0, 142],
    [54, 0, 142],
    [56, 0, 143],
    [57, 0, 144],
    [59, 0, 145],
    [60, 0, 146],
    [62, 0, 147],
    [63, 0, 147],
    [65, 0, 148],
    [66, 0, 149],
    [68, 0, 149],
    [69, 0, 150],
    [71, 0, 150],
    [73, 0, 150],
    [74, 0, 150],
    [76, 0, 151],
    [78, 0, 151],
    [79, 0, 151],
    [81, 0, 151],
    [82, 0, 152],
    [84, 0, 152],
    [86, 0, 152],
    [88, 0, 153],
    [90, 0, 153],
    [92, 0, 153],
    [93, 0, 154],
    [95, 0, 154],
    [97, 0, 155],
    [99, 0, 155],
    [100, 0, 155],
    [102, 0, 155],
    [104, 0, 155],
    [106, 0, 155],
    [108, 0, 156],
    [109, 0, 156],
    [111, 0, 156],
    [112, 0, 156],
    [113, 0, 157],
    [115, 0, 157],
    [117, 0, 157],
    [119, 0, 157],
    [120, 0, 157],
    [122, 0, 157],
    [124, 0, 157],
    [126, 0, 157],
    [127, 0, 157],
    [129, 0, 157],
    [131, 0, 157],
    [132, 0, 157],
    [134, 0, 157],
    [135, 0, 157],
    [137, 0, 157],
    [138, 0, 157],
    [139, 0, 157],
    [141, 0, 157],
    [143, 0, 156],
    [145, 0, 156],
    [147, 0, 156],
    [149, 0, 156],
    [150, 0, 155],
    [152, 0, 155],
    [153, 0, 155],
    [155, 0, 155],
    [156, 0, 155],
    [157, 0, 155],
    [159, 0, 155],
    [160, 0, 155],
    [162, 0, 155],
    [163, 0, 155],
    [164, 0, 155],
    [166, 0, 154],
    [167, 0, 154],
    [168, 0, 154],
    [169, 0, 153],
    [170, 0, 153],
    [171, 0, 153],
    [173, 0, 153],
    [174, 1, 152],
    [175, 1, 152],
    [176, 1, 152],
    [176, 1, 152],
    [177, 1, 151],
    [178, 1, 151],
    [179, 1, 150],
    [180, 2, 150],
    [181, 2, 149],
    [182, 2, 149],
    [183, 3, 149],
    [184, 3, 149],
    [185, 4, 149],
    [186, 4, 149],
    [186, 4, 148],
    [187, 5, 147],
    [188, 5, 147],
    [189, 5, 147],
    [190, 6, 146],
    [191, 6, 146],
    [191, 6, 146],
    [192, 7, 145],
    [192, 7, 145],
    [193, 8, 144],
    [193, 9, 144],
    [194, 10, 143],
    [195, 10, 142],
    [195, 11, 142],
    [196, 12, 141],
    [197, 12, 140],
    [198, 13, 139],
    [198, 14, 138],
    [199, 15, 137],
    [200, 16, 136],
    [201, 17, 135],
    [202, 18, 134],
    [202, 19, 133],
    [203, 19, 133],
    [203, 20, 132],
    [204, 21, 130],
    [205, 22, 129],
    [206, 23, 128],
    [206, 24, 126],
    [207, 24, 124],
    [207, 25, 123],
    [208, 26, 121],
    [209, 27, 120],
    [209, 28, 118],
    [210, 28, 117],
    [210, 29, 116],
    [211, 30, 114],
    [211, 32, 113],
    [212, 33, 111],
    [212, 34, 110],
    [213, 35, 107],
    [213, 36, 105],
    [214, 37, 103],
    [215, 38, 101],
    [216, 39, 100],
    [216, 40, 98],
    [217, 42, 96],
    [218, 43, 94],
    [218, 44, 92],
    [219, 46, 90],
    [219, 47, 87],
    [220, 47, 84],
    [221, 48, 81],
    [221, 49, 78],
    [222, 50, 74],
    [222, 51, 71],
    [223, 52, 68],
    [223, 53, 65],
    [223, 54, 61],
    [224, 55, 58],
    [224, 56, 55],
    [224, 57, 51],
    [225, 58, 48],
    [226, 59, 45],
    [226, 60, 42],
    [227, 61, 38],
    [227, 62, 35],
    [228, 63, 32],
    [228, 65, 29],
    [228, 66, 28],
    [229, 67, 27],
    [229, 68, 25],
    [229, 69, 24],
    [230, 70, 22],
    [231, 71, 21],
    [231, 72, 20],
    [231, 73, 19],
    [232, 74, 18],
    [232, 76, 16],
    [232, 76, 15],
    [233, 77, 14],
    [233, 77, 13],
    [234, 78, 12],
    [234, 79, 12],
    [235, 80, 11],
    [235, 81, 10],
    [235, 82, 10],
    [235, 83, 9],
    [236, 84, 9],
    [236, 86, 8],
    [236, 87, 8],
    [236, 88, 8],
    [237, 89, 7],
    [237, 90, 7],
    [237, 91, 6],
    [238, 92, 6],
    [238, 92, 5],
    [238, 93, 5],
    [238, 94, 5],
    [239, 95, 4],
    [239, 96, 4],
    [239, 97, 4],
    [239, 98, 4],
    [240, 99, 3],
    [240, 100, 3],
    [240, 101, 3],
    [241, 102, 3],
    [241, 102, 3],
    [241, 103, 3],
    [241, 104, 3],
    [241, 105, 2],
    [241, 106, 2],
    [241, 107, 2],
    [241, 107, 2],
    [242, 108, 1],
    [242, 109, 1],
    [242, 110, 1],
    [243, 111, 1],
    [243, 112, 1],
    [243, 113, 1],
    [243, 114, 1],
    [244, 115, 0],
    [244, 116, 0],
    [244, 117, 0],
    [244, 118, 0],
    [244, 119, 0],
    [244, 120, 0],
    [244, 122, 0],
    [245, 123, 0],
    [245, 124, 0],
    [245, 126, 0],
    [245, 127, 0],
    [246, 128, 0],
    [246, 129, 0],
    [246, 130, 0],
    [247, 131, 0],
    [247, 132, 0],
    [247, 133, 0],
    [247, 134, 0],
    [248, 135, 0],
    [248, 136, 0],
    [248, 136, 0],
    [248, 137, 0],
    [248, 138, 0],
    [248, 139, 0],
    [248, 140, 0],
    [249, 141, 0],
    [249, 141, 0],
    [249, 142, 0],
    [249, 143, 0],
    [249, 144, 0],
    [249, 145, 0],
    [249, 146, 0],
    [249, 147, 0],
    [250, 148, 0],
    [250, 149, 0],
    [250, 150, 0],
    [251, 152, 0],
    [251, 153, 0],
    [251, 154, 0],
    [251, 156, 0],
    [252, 157, 0],
    [252, 159, 0],
    [252, 160, 0],
    [252, 161, 0],
    [253, 162, 0],
    [253, 163, 0],
    [253, 164, 0],
    [253, 166, 0],
    [253, 167, 0],
    [253, 168, 0],
    [253, 170, 0],
    [253, 171, 0],
    [253, 172, 0],
    [253, 173, 0],
    [253, 174, 0],
    [254, 175, 0],
    [254, 176, 0],
    [254, 177, 0],
    [254, 178, 0],
    [254, 179, 0],
    [254, 180, 0],
    [254, 181, 0],
    [254, 182, 0],
    [254, 184, 0],
    [254, 185, 0],
    [254, 185, 0],
    [254, 186, 0],
    [254, 187, 0],
    [254, 188, 0],
    [254, 189, 0],
    [254, 190, 0],
    [254, 192, 0],
    [254, 193, 0],
    [254, 194, 0],
    [254, 195, 0],
    [254, 196, 0],
    [254, 197, 0],
    [254, 198, 0],
    [254, 199, 0],
    [254, 200, 0],
    [254, 201, 1],
    [254, 202, 1],
    [254, 202, 1],
    [254, 203, 1],
    [254, 204, 2],
    [254, 205, 2],
    [254, 206, 3],
    [254, 207, 4],
    [254, 207, 4],
    [254, 208, 5],
    [254, 209, 6],
    [254, 211, 8],
    [254, 212, 9],
    [254, 213, 10],
    [254, 214, 10],
    [254, 215, 11],
    [254, 216, 12],
    [254, 217, 13],
    [255, 218, 14],
    [255, 218, 14],
    [255, 219, 16],
    [255, 220, 18],
    [255, 220, 20],
    [255, 221, 22],
    [255, 222, 25],
    [255, 222, 27],
    [255, 223, 30],
    [255, 224, 32],
    [255, 225, 34],
    [255, 226, 36],
    [255, 226, 38],
    [255, 227, 40],
    [255, 228, 43],
    [255, 228, 46],
    [255, 229, 49],
    [255, 230, 53],
    [255, 230, 56],
    [255, 231, 60],
    [255, 232, 63],
    [255, 233, 67],
    [255, 234, 70],
    [255, 235, 73],
    [255, 235, 77],
    [255, 236, 80],
    [255, 237, 84],
    [255, 238, 87],
    [255, 238, 91],
    [255, 238, 95],
    [255, 239, 99],
    [255, 239, 103],
    [255, 240, 106],
    [255, 240, 110],
    [255, 241, 114],
    [255, 241, 119],
    [255, 241, 123],
    [255, 242, 128],
    [255, 242, 133],
    [255, 242, 138],
    [255, 243, 142],
    [255, 244, 146],
    [255, 244, 150],
    [255, 244, 154],
    [255, 245, 158],
    [255, 245, 162],
    [255, 245, 166],
    [255, 246, 170],
    [255, 246, 175],
    [255, 247, 179],
    [255, 247, 182],
    [255, 248, 186],
    [255, 248, 189],
    [255, 248, 193],
    [255, 248, 196],
    [255, 249, 199],
    [255, 249, 202],
    [255, 249, 205],
    [255, 250, 209],
    [255, 250, 212],
    [255, 251, 216],
    [255, 252, 219],
    [255, 252, 223],
    [255, 253, 226],
    [255, 253, 229],
    [255, 253, 232],
    [255, 254, 235],
    [255, 254, 238],
    [255, 254, 241],
    [255, 254, 244],
    [255, 255, 246],
  ],
};
