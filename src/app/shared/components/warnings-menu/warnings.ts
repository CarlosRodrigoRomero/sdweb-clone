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
  //   {
  //     type: 'sumNumsCriticidad',
  //     message: 'El nº de anomalías no coincide con la suma de las anomalías por criticidad',
  //     actions: [
  //       {
  //         name: 'numsCriticidad',
  //         label: 'Corregir',
  //       },
  //     ],
  //   },
  //   {
  //     type: 'numCriticidad',
  //     message: 'El nº de anomalías por criticidad es incorrecto',
  //     actions: [
  //       {
  //         name: 'numsCriticidad',
  //         label: 'Corregir',
  //       },
  //     ],
  //   },
];
