interface WarningAction {
  name: string;
  label: string;
}

export interface Warning {
  id?: string;
  type: string;
  visible?: boolean;
  message?: string;
  adminActions?: WarningAction[];
  reportActions?: WarningAction[];
}

export const warnings: Warning[] = [
  {
    type: 'sumTiposAnom',
    message: 'El nº de anomalías no coincide con la suma de los tipos de anomalías',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'tiposAnom',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'tiposAnom',
    message: 'El nº de anomalías por tipo es incorrecto',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'tiposAnom',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'sumNumsCoA',
    message: 'El nº de anomalías no coincide con la suma de los CoA',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'numsCoA',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'numsCoA',
    message: 'El nº de anomalías por clase es incorrecto',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'numsCoA',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'sumNumsCriticidad',
    message: 'El nº de anomalías no coincide con la suma de las anomalías por criticidad',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'numsCriticidad',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'numsCriticidad',
    message: 'El nº de anomalías por criticidad es incorrecto',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'numsCriticidad',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'filsColsPlantaSegs',
    message: 'El nº de filas y columnas de la planta no son correctos y por tanto MAE y CC están mal',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'irPlantaEdit',
        label: 'Ir a Editar planta',
      },
      {
        name: 'recalMAEyCC',
        label: 'Recalcular MAE y CC',
      },
    ],
  },
  {
    type: 'filsColsAnoms',
    message: 'Hay anomalías con posibles datos de fila y columna erroneos',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'filsColsAnoms',
        label: 'Filtrar',
      },
    ],
  },
  {
    type: 'filsColsAnoms0',
    message: 'Hay anomalías con fila o columna igual a 0',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'filsColsAnoms0',
        label: 'Filtrar',
      },
    ],
  },
  {
    type: 'noLocAreas',
    message: 'Faltan las zonas de la planta',
    adminActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
    reportActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
  },
  // solo para fijas y S1E
  {
    type: 'wrongLocAnoms',
    message: 'Hay anomalías que pueden estar mal posicionadas y estar fuera de las zonas que deberían',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'wrongLocAnoms',
        label: 'Filtrar',
      },
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
      {
        name: 'recalGlobalCoords',
        label: 'Recalcular globalCoords',
      },
    ],
  },
  {
    type: 'noGlobalCoordsAnoms',
    message: 'Hay anomalías que no tienen globalCoords',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'noGlobalCoordsAnoms',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'nombresZonas',
    message: 'Faltan los nombres de las zonas de la planta',
    adminActions: [
      {
        name: 'irPlantaEdit',
        label: 'Ir a Editar planta',
      },
    ],
    reportActions: [
      {
        name: 'irPlantaEdit',
        label: 'Ir a Editar planta',
      },
    ],
  },
  {
    type: 'zonasRepeat',
    message: 'Hay zonas con el mismo nombre',
    adminActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
    reportActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
  },
  {
    type: 'modulosPlanta',
    message: 'Faltan los módulos de la planta',
    adminActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
    reportActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
  },
  {
    type: 'modulosAnoms',
    message: 'Hay anomalías sin módulo',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'modulosAnoms',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'tiposSeguidor',
    message: 'Faltan los tipos de seguidor de la planta',
    adminActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
    reportActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
  },
  {
    type: 'visualLayer',
    message: 'No existe la capa visual',
    adminActions: [
      {
        name: '',
        label: '',
      },
    ],
    reportActions: [
      {
        name: '',
        label: '',
      },
    ],
  },
  {
    type: 'thermalLayer',
    message: 'No existe la capa térmica',
    adminActions: [
      {
        name: '',
        label: '',
      },
    ],
    reportActions: [
      {
        name: '',
        label: '',
      },
    ],
  },
  {
    type: 'imgPortada',
    message: 'Falta la imagen de portada en Storage',
    adminActions: [
      {
        name: 'irStorage',
        label: 'Ir al Storage',
      },
    ],
    reportActions: [
      {
        name: 'irStorage',
        label: 'Ir al Storage',
      },
    ],
  },
  {
    type: 'imgSuciedad',
    message: 'Falta la imagen de suciedad en Storage',
    adminActions: [
      {
        name: 'irStorage',
        label: 'Ir al Storage',
      },
    ],
    reportActions: [
      {
        name: 'irStorage',
        label: 'Ir al Storage',
      },
    ],
  },
  {
    type: 'mae',
    message: 'El MAE es incorrecto',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'recalMAEyCC',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'cc',
    message: 'El CC es incorrecto',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: 'recalMAEyCC',
        label: 'Corregir',
      },
    ],
  },
  {
    type: 'tempMaxAnoms',
    message: 'Hay un error con la temperaturas máximas de varias anomalías',
    adminActions: [
      {
        name: 'irInforme',
        label: 'Ir al Informe',
      },
    ],
    reportActions: [
      {
        name: '',
        label: '',
      },
    ],
  },
  {
    type: 'segsRepeatName',
    message: 'Hay seguidores con el mismo nombre',
    adminActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
    reportActions: [
      {
        name: 'irLocs',
        label: 'Ir a Localizaciones',
      },
    ],
  },
];
