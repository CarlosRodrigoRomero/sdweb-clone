export interface InformeInterface {
  id?: string;
  plantaId?: string;
  fecha?: number;
  hora_inicio?: any;
  hora_fin?: any;
  temperatura?: number;
  irradiancia?: number;
  velocidad?: number;
  carpetaBase?: string;
  mae?: number;
  cc?: number;
  alturaVuelo?: number;
  nubosidad?: number;
  numeroModulos?: number;
  gsd?: number;
  emisividad?: number;
  tempReflejada?: number;
  disponible?: boolean;
  rangeMin?: number;
  rangeMax?: number;
  distancia?: number;
  prefijo?: string;
  viento?: string;
  correccHoraSrt?: number;
  humedadRelativa?: number;
  jpgVisual?: boolean;
  carpetaJpgGray?: string;
  pc_pct?: number;
  vueloId?: string;
  vientoVelocidad?: number;
  vientoDireccion?: number;
  camara?: string;
  camaraSN?: number;
}