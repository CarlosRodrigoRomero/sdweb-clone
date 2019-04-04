export interface PlantaInterface {
    id?: string;
    nombre?: string;
    contacto?: string;
    telefono?: number;
    longitud?: number;
    latitud?: number;
    tipo?: string;
    potencia?: number;
    empresaId?: string;
    notas?: string;
    filas?: number;
    columnas?: number;
    vertical?: boolean;
    num_modulos?: number;
    temp_limite?: number;
    zoom?: number;
}
