export interface InformeInterface {
    id?: string;
    plantaId?: string;
    fecha?: number;
    hora_inicio?: any;
    hora_fin?: any;
    temperatura?: number;
    irradiancia?: number;
    tempMediaModulos?: number;
    velocidad?: number;
    carpeta?: string;
    carpetaBase?: string;
    mae?: number;
    tempMax?: number;
    tempMin?: number;
    tempLimite?: number;
    alturaVuelo?: number;
    nubosidad?: number;
    numeroModulos?: number;
    gsd?: number;
}
