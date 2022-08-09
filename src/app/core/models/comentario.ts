export interface Comentario {
  id?: string;
  texto: string;
  datetime: number;
  anomaliaId: string;
  informeId: string;
  autor?: string;
}
