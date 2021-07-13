export interface NormalizedModule {
  id?: string;
  fila: number;
  columna: number;
  image_name?: string;
  agrupacionId?: string;
  coords: {
    topLeft: {
      long: number;
      lat: number;
    };
    topRight: {
      long: number;
      lat: number;
    };
    bottomLeft: {
      long: number;
      lat: number;
    };
    bottomRight: {
      long: number;
      lat: number;
    };
  };
}
