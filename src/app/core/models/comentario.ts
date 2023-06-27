export interface Comentario {
  id?: string;
  tipo: string; // 'anomalia', 'iv', 'actuaciones'
  texto: string;
  datetime: number;
  anomaliaId: string;
  informeId: string;
  autor?: string;
}
