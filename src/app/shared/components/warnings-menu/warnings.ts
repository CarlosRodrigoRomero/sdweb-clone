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
    type: 'filsColsPlantaFija',
    message: 'El nº de filas y columnas de la planta no son correctos',
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
    ],
  },
];
