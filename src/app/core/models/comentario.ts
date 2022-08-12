export interface Comentario {
  id?: string;
  tipo: string;
  texto: string;
  datetime: number;
  anomaliaId: string;
  informeId: string;
  autor?: string;
}
