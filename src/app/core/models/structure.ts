export interface Structure {
  id?: string;
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
  filas: number;
  columnas: number;
}
