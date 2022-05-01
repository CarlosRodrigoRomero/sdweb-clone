import { DownloadReportService } from '@data/services/download-report.service';

export interface Apartado {
  nombre: string;
  descripcion: string;
  orden: number;
  elegible: boolean;
  apt?: number;
}

export interface AnomsTable {
  tipo: string;
  coa1: number;
  coa2: number;
  coa3: number;
  total: number;
}

export let ApartadosInforme: Apartado[] = [
  {
    nombre: 'introduccion',
    descripcion: 'Introducción',
    orden: 1,
    apt: 1,
    elegible: false,
  },
  {
    nombre: 'criterios',
    descripcion: 'Criterios de operación',
    orden: 2,
    apt: 1,
    elegible: true,
  },
  {
    nombre: 'normalizacion',
    descripcion: 'Normalización de gradientes de temperatura',
    orden: 3,
    apt: 1,
    elegible: true,
  },
  {
    nombre: 'datosVuelo',
    descripcion: 'Datos del vuelo',
    orden: 4,
    apt: 1,
    elegible: true,
  },
  {
    nombre: 'irradiancia',
    descripcion: 'Irradiancia durante el vuelo',
    orden: 5,
    apt: 1,
    elegible: true,
  },
  {
    nombre: 'paramsTermicos',
    descripcion: 'Ajuste de parámetros térmicos',
    orden: 6,
    apt: 1,
    elegible: true,
  },
  {
    nombre: 'perdidaPR',
    descripcion: 'Pérdida de Performance Ratio',
    orden: 7,
    apt: 1,
    elegible: true,
  },
  {
    nombre: 'clasificacion',
    descripcion: 'Cómo se clasifican las anomalías',
    orden: 8,
    apt: 1,
    elegible: true,
  },
  {
    nombre: 'resultadosClase',
    descripcion: 'Resultados por clase',
    orden: 11,
    apt: 2,
    elegible: true,
  },
  {
    nombre: 'resultadosCategoria',
    descripcion: 'Resultados por categoría',
    orden: 12,
    apt: 2,
    elegible: true,
  },
  {
    nombre: 'resultadosPosicion',
    descripcion: 'Resultados por posición',
    orden: 13,
    apt: 2,
    elegible: true,
  },
  {
    nombre: 'perdidaPR',
    descripcion: 'Pérdida de Performance Ratio',
    orden: 7,
    apt: 1,
    elegible: true,
  },
  {
    nombre: 'resultadosMAE',
    descripcion: 'MAE de la planta',
    orden: 14,
    apt: 2,
    elegible: true,
  },
  {
    nombre: 'anexo1',
    descripcion: 'Anexo I: Listado resumen de anomalías térmicas',
    orden: 15,
    elegible: true,
  },
  {
    nombre: 'anexoSeguidores',
    descripcion: 'Anexo II: Anomalías térmicas por seguidor',
    orden: 16,
    elegible: true,
  },
  {
    nombre: 'anexoSegsNoAnoms',
    descripcion: 'Anexo III: Seguidores sin anomalías',
    orden: 17,
    elegible: true,
  },
  // si no hay zonas no se incluye el plano termico
  {
    nombre: 'planoTermico',
    descripcion: 'Plano térmico',
    orden: 9,
    apt: 2,
    elegible: false,
  },
  // solo disponible para plantas con pocas anomalias
  {
    nombre: 'anexoAnomalias',
    descripcion: 'Anexo II: Anomalías térmicas',
    orden: 16,
    elegible: true,
  },
  // solo para S1E
  {
    nombre: 'anexoSeguidores1EjeAnoms',
    descripcion: 'Anexo III: Anomalías térmicas por seguidor',
    orden: 17,
    elegible: true,
  },
  {
    nombre: 'anexoSeguidores1EjeNoAnoms',
    descripcion: 'Anexo III: Seguidores sin anomalías',
    orden: 18,
    elegible: true,
  },
  // solo se añade el plano visual si hay zonas y es un informe de 2021 en adelante
  {
    nombre: 'planoVisual',
    descripcion: 'Plano visual',
    orden: 10,
    apt: 2,
    elegible: false,
  },
];
