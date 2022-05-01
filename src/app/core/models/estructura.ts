import { GLOBAL } from '@data/constants/global';
import { ElementoPlantaInterface } from './elementoPlanta';
import { LatLngLiteral } from '@agm/core';
import { ModuloInterface } from './modulo';
import { Point } from '@agm/core/services/google-maps-types';
import { Pc } from './pc';

export interface RectanguloInterface {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
export interface CuadrilateroInterface {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
}
export interface EstructuraConPcs {
  estructura: Estructura;
  pcs: Pc[];
}

export interface EstructuraInterface {
  id?: string;
  archivo: string;
  vuelo: string;
  coords: any[];
  filas: number;
  columnas: number;
  sentido: boolean; // false: izq->drcha | true: drcha -> izq
  columnaInicio: number;
  filaInicio: number;
  latitud: number;
  longitud: number;
  globalCoords?: any[];
  modulo?: ModuloInterface;
  estructuraCoords?: any[];
}

export class Estructura implements EstructuraInterface, ElementoPlantaInterface {
  id: string;
  archivo: string;
  vuelo: string;
  coords: any[];
  filas: number;
  columnas: number;
  sentido: boolean; // false: izq->drcha | true: drcha -> izq
  columnaInicio: number;
  filaInicio: number;

  latitud: number;
  longitud: number;
  globalCoords: any[];
  modulo?: ModuloInterface;

  estructuraMatrix: any[];

  estructuraCoords: any[][][];

  constructor(est: EstructuraInterface) {
    this.id = est.id;
    this.archivo = est.archivo;
    this.vuelo = est.vuelo;
    this.coords = est.coords;
    this.filas = est.filas;
    this.columnas = est.columnas;
    this.sentido = est.sentido;
    this.columnaInicio = est.columnaInicio;
    this.filaInicio = est.filaInicio;
    this.latitud = est.latitud;
    this.longitud = est.longitud;
    this.modulo = est.modulo !== undefined ? est.modulo : null;

    let globalCoords;
    if (!est.hasOwnProperty('globalCoords')) {
      globalCoords = [];
    } else {
      globalCoords = est.globalCoords;
    }
    for (let i = globalCoords.length; i < GLOBAL.numGlobalCoords; i++) {
      globalCoords.push('');
    }
    this.globalCoords = globalCoords;

    Object.defineProperty(this, 'estructuraMatrix', {
      enumerable: false,
      writable: true,
    });
    if (est.estructuraCoords !== undefined) {
      this.estructuraCoords = this.estructureCoordsToArray(est.estructuraCoords);
      this.estructuraMatrix = null;
      if (est.estructuraCoords !== null) {
        this.filas = this.estructuraCoords.length;
        this.columnas = Math.max(...this.estructuraCoords.map((filas) => filas.length));
      }
    } else {
      this.estructuraCoords = null;
      this.estructuraMatrix = this.getEstructuraMatrix();
    }
  }

  getLatLng(): LatLngLiteral {
    return { lat: this.latitud, lng: this.longitud };
  }

  setLatLng(latLng: LatLngLiteral): void {
    this.latitud = latLng.lat;
    this.longitud = latLng.lng;
  }

  setGlobals(globals: any[]) {
    globals.forEach((v, i, array) => {
      this.globalCoords[i] = v;
    });
  }

  setModulo(modulo: ModuloInterface) {
    if (modulo !== undefined) {
      this.modulo = modulo;
    }
  }

  calcularFilaColumna(x: number, y: number) {
    let distanciaMinima = 999999;
    let columnaDistMin;
    let filaDistMin;

    for (let fila = 1; fila < this.filas + 1; fila++) {
      for (let col = 1; col < this.columnas + 1; col++) {
        // Para cada modulo ...
        let distancia = 0;
        for (let i = 0; i < 2; i++) {
          // horizontal
          for (let j = 0; j < 2; j++) {
            // vertical
            // para cada esquina, sumamos distancia

            const p = this.estructuraMatrix[fila - 1 + i][col - 1 + j];

            distancia = distancia + Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
          }
        }

        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          columnaDistMin = col;
          filaDistMin = fila;
        }
      }
    }

    return [filaDistMin, columnaDistMin];
  }

  private estructureCoordsToArray(coords: any[]) {
    if (coords !== null) {
      const array: any[][][] = Object.values(coords);

      array.forEach((fila, index) => {
        array[index] = Object.values(fila);
      });
      array.forEach((fila, indexF) => {
        fila.forEach((columna, indexC) => {
          array[indexF][indexC] = Object.values(columna);
        });
      });

      return array;
    } else {
      return null;
    }
  }

  private kClosest(points: Point[], k) {
    // sorts the array in place
    points.sort((point1, point2) => {
      const distanceFromOrigin1 = this.getDistanceFromOrigin(point1);
      const distanceFromOrigin2 = this.getDistanceFromOrigin(point2);

      // sort by distance from origin, lowest first
      return distanceFromOrigin1 - distanceFromOrigin2;
    });

    // returns first k elements
    return points.slice(0, k);
  }

  private getDistanceFromOrigin(p: Point) {
    return p.x * p.x + p.y * p.y;
  }
  private getTrBl(points: Point[]): Point[] {
    return points.sort((p1, p2) => {
      return p1.x - p2.x;
    });
  }

  getCuadrilatero(columna: number, fila: number): CuadrilateroInterface {
    const p1 = this.estructuraMatrix[fila - 1][columna - 1] as Point;
    const p2 = this.estructuraMatrix[fila - 1][columna] as Point;
    const p3 = this.estructuraMatrix[fila][columna] as Point;
    const p4 = this.estructuraMatrix[fila][columna - 1] as Point;
    const points = [p1, p2, p3, p4];
    const sorted = this.kClosest(points, 4);
    const topLeft = sorted[0];
    const bottomRight = sorted[3];
    const others = [sorted[1], sorted[2]];
    const bottomLeft = this.getTrBl(others)[0];
    const topRight = this.getTrBl(others)[1];

    return { tl: topLeft, tr: topRight, br: bottomRight, bl: bottomLeft } as CuadrilateroInterface;
  }

  getFilaColumnaRef(columna: number, fila: number): number[] {
    let filaRef: number;
    let columnaRef: number;
    let columnas = this.columnas;
    if (this.estructuraCoords !== null) {
      columnas = this.getColumnasFila(fila);
    }
    if (columnas === 1) {
      columnaRef = 1;
      if (fila === this.filas) {
        filaRef = fila - 1;
      } else {
        filaRef = fila + 1;
      }
    } else {
      filaRef = fila;
      if (columna === columnas) {
        columnaRef = columna - 1;
      } else {
        columnaRef = columna + 1;
      }
    }
    return [columnaRef, filaRef];
  }

  private getColumnasFila(fila: number): number {
    return this.estructuraCoords[fila - 1].length;
  }

  getRectanguloExterior(columna: number, fila: number): RectanguloInterface {
    const cuadrilatero = this.getCuadrilatero(columna, fila);

    const top = Math.round(Math.min(cuadrilatero.tr.y, cuadrilatero.tl.y));
    const left = Math.round(Math.min(cuadrilatero.bl.x, cuadrilatero.tl.x));
    const bottom = Math.round(Math.max(cuadrilatero.br.y, cuadrilatero.bl.y));
    const right = Math.round(Math.max(cuadrilatero.tr.x, cuadrilatero.br.x));

    return { top, bottom, left, right } as RectanguloInterface;
  }

  getRectanguloInterior(columna: number, fila: number): RectanguloInterface {
    const cuadrilatero = this.getCuadrilatero(columna, fila);

    const top = Math.round(Math.max(cuadrilatero.tr.y, cuadrilatero.tl.y));
    const left = Math.round(Math.max(cuadrilatero.bl.x, cuadrilatero.tl.x));
    const bottom = Math.round(Math.min(cuadrilatero.br.y, cuadrilatero.bl.y));
    const right = Math.round(Math.min(cuadrilatero.tr.x, cuadrilatero.br.x));

    return { top, bottom, left, right } as RectanguloInterface;
  }

  getRectanguloAutoEst(fila: number, columna: number) {
    const rect = this.estructuraCoords[fila - 1][columna - 1];

    return { top: rect[2][1], bottom: rect[0][1], left: rect[0][0], right: rect[1][0] } as RectanguloInterface;
  }

  getFilaColumnaAutoEst(x: number, y: number): any[] {
    const point = [x, y];
    let filaSeleccionada = 0;
    let columnaSelecciona = 0;
    let menorDistancia = 999999;

    this.estructuraCoords.forEach((fila, filIndex) => {
      fila.forEach((modulo, colIndex) => {
        let sumaDistancias = 0;
        modulo.forEach((p) => {
          const distancia = this.distanceBetweenTwoPoints(point, p);
          sumaDistancias = sumaDistancias + distancia;
        });
        if (sumaDistancias < menorDistancia) {
          menorDistancia = sumaDistancias;
          filaSeleccionada = filIndex + 1;
          columnaSelecciona = colIndex + 1;
        }
      });
    });

    return [filaSeleccionada, columnaSelecciona];
  }

  private distanceBetweenTwoPoints(a: number[], b: number[]) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }

  getLocalCoordsFromEstructura(columna, fila) {
    let columnaReal = columna;
    let filaReal = fila;

    if (this.hasOwnProperty('sentido')) {
      columnaReal = this.sentido ? this.columnas - columna + 1 : columna;
    }
    if (this.hasOwnProperty('columnaInicio')) {
      columnaReal = columnaReal + this.columnaInicio - 1;
    }
    if (this.hasOwnProperty('filaInicio')) {
      filaReal = filaReal + this.filaInicio - 1;
    }

    return [columnaReal, filaReal];
  }

  getEstructuraMatrix() {
    const estructuraMatrix = [];
    for (let i = 0; i < this.filas + 1; i++) {
      estructuraMatrix[i] = new Array(this.columnas + 1);
    }

    const ladosEstructura = [];

    // 1 - Obtenemos coords (x,y) de los cuatro lados
    // [0, 1, 2, 3] == [tl, tr, br, bl] el poligono tiene 4 esquinas
    for (let i = 0; i < 4; i++) {
      // para cada esquina ...
      const p1a = this.coords[i];
      let p2a = this.coords[i + 1];

      let numeroDivisiones: number;
      if (i === 0) {
        // top-left/bottom-right, inicio de columna
        numeroDivisiones = this.columnas;
        estructuraMatrix[0][0] = p1a;
      } else if (i === 1) {
        // top-right
        numeroDivisiones = this.filas;
        estructuraMatrix[0][this.columnas] = p1a;
      } else if (i === 2) {
        // bottom-right
        numeroDivisiones = this.columnas;
        estructuraMatrix[this.filas][this.columnas] = p1a;
      } else if (i === 3) {
        // bottom-left
        numeroDivisiones = this.filas;
        estructuraMatrix[this.filas][0] = p1a;
        // si la esquina es la numero 3 (bottom-left), entonces p2 es top-left
        p2a = this.coords[0];
      }

      // Obtenemos la ecuacion de la recta (y = mx+b)

      const m = (p2a.y - p1a.y) / (p2a.x - p1a.x);
      const b = isFinite(m) ? p2a.y - m * p2a.x : p1a.x;

      ladosEstructura[i] = [m, b];
    }

    // Creamos estas variables auxiliars más faciles de manejar
    const bl = estructuraMatrix[this.filas][0];
    const br = estructuraMatrix[this.filas][this.columnas];
    const tl = estructuraMatrix[0][0];
    const tr = estructuraMatrix[0][this.columnas];

    // 2 - Hayar los puntos de intersección de los lados no contiguos 'pf1' y 'pf2' (pf=punto de fuga)
    const pf1 = this.interseccionRectas(
      ladosEstructura[0][0],
      ladosEstructura[0][1],
      ladosEstructura[2][0],
      ladosEstructura[2][1]
    );

    const pf2 = this.interseccionRectas(
      ladosEstructura[1][0],
      ladosEstructura[1][1],
      ladosEstructura[3][0],
      ladosEstructura[3][1]
    );

    // 3 - Hallar Recta1 que pasa por pf1 y pf2 (linea de tierra).
    const [r1m, r1b] = this.rectaPor2Puntos(pf1, pf2);

    // 4 - Hallar Recta2 paralela a Recta1 y que paso por un punto interno a la estructura
    const pInterno = {
      x: (Math.max(tl.x, bl.x) + Math.min(tr.x, br.x)) * 0.5,
      y: (Math.max(tl.y, tr.y) + Math.min(br.y, bl.y)) * 0.5,
    };
    const r2m = r1m;
    const r2b = pInterno.y - r2m * pInterno.x;

    // 5 - Hallar interseccion de Recta2 con lado superior (p0), lado derecho (p1), lado inferior (p2) y lado izquierdo(p3)
    const p0 = this.interseccionRectas(r2m, r2b, ladosEstructura[0][0], ladosEstructura[0][1]);
    const p1 = this.interseccionRectas(r2m, r2b, ladosEstructura[1][0], ladosEstructura[1][1]);
    const p2 = this.interseccionRectas(r2m, r2b, ladosEstructura[2][0], ladosEstructura[2][1]);
    const p3 = this.interseccionRectas(r2m, r2b, ladosEstructura[3][0], ladosEstructura[3][1]);

    // 6a - Para cada filas
    // 6a.1 Dividir en f=filas partes iguales el segmento p0-p2
    const divFilas = Math.abs(p0.x - p2.x) / this.filas;
    for (let fila = 1; fila < this.filas; fila++) {
      // 6a.2 Hallar Recta3 interseccion de dicho punto con pf1
      const sentido = p0.x > p2.x ? -1 : 1;

      const xDiv = p0.x + sentido * fila * divFilas;
      const yDiv = xDiv * r2m + r2b;
      const pDiv = { x: xDiv, y: yDiv } as Point;

      const [r3m, r3b] = this.rectaPor2Puntos(pf1, pDiv);

      // 6a.2 Hallar interseccion de Recta3 con lado izquierdo (p5) y lado derecho (p6)
      const p5 = this.interseccionRectas(r3m, r3b, ladosEstructura[3][0], ladosEstructura[3][1]);
      const p6 = this.interseccionRectas(r3m, r3b, ladosEstructura[1][0], ladosEstructura[1][1]);

      // const filaAux = p0.y < p2.y ? fila : estructura.filas - fila;

      estructuraMatrix[fila][0] = p5;
      estructuraMatrix[fila][this.columnas] = p6;
    }

    // 6b - Para cada columna
    // 6b.1 Dividir en c=columnas partes iguales el segmento p1-p3
    const divColumnas = Math.abs(p1.x - p3.x) / this.columnas;
    for (let col = 1; col < this.columnas; col++) {
      // 6b.2 Hallar Recta4 interseccion de dicho punto con pf2
      const sentido = p3.x > p1.x ? -1 : 1;

      const xDiv = p3.x + sentido * col * divColumnas;
      const yDiv = xDiv * r2m + r2b;
      const pDiv = { x: xDiv, y: yDiv } as Point;

      const [r4m, r4b] = this.rectaPor2Puntos(pf2, pDiv);
      // 6b.2 Hallar interseccion de Recta4 con lado inferior (p7) y lado superior (p8)
      const p7 = this.interseccionRectas(r4m, r4b, ladosEstructura[2][0], ladosEstructura[2][1]);
      const p8 = this.interseccionRectas(r4m, r4b, ladosEstructura[0][0], ladosEstructura[0][1]);

      estructuraMatrix[0][col] = p8;
      estructuraMatrix[this.filas][col] = p7;
    }

    // 7 - Obtener puntos interseccion de las lineas rectas

    for (let col = 1; col < this.columnas; col++) {
      // obtener la recta
      const p1a = estructuraMatrix[0][col];
      const p2a = estructuraMatrix[this.filas][col];

      const [ma, ba] = this.rectaPor2Puntos(p1a, p2a);

      // para cada fila ...
      for (let fila = 1; fila < this.filas; fila++) {
        // obtener la recta
        const p1b = estructuraMatrix[fila][0];
        const p2b = estructuraMatrix[fila][this.columnas];

        const [mb, bb] = this.rectaPor2Puntos(p1b, p2b);

        // hallar interseccion
        const pInterseccion = this.interseccionRectas(ma, ba, mb, bb);

        // almacenar en arrayEstructura
        estructuraMatrix[fila][col] = {
          x: Math.round(pInterseccion.x),
          y: Math.round(pInterseccion.y),
        };
      }
    }

    return estructuraMatrix;
  }
  private rectaPor2Puntos(p1: Point, p2: Point) {
    const m = (p2.y - p1.y) / (p2.x - p1.x);
    let b: number;
    if (!isFinite(m)) {
      b = p1.x;
    } else {
      b = p2.y - m * p2.x;
    }
    return [m, b]; // y = m * x + b
  }
  private interseccionRectas(m1: number, b1: number, m2: number, b2: number): Point {
    if (!isFinite(m1)) {
      return { x: b1, y: m2 * b1 + b2 } as Point;
    } else if (!isFinite(m2)) {
      return { x: b2, y: m1 * b2 + b1 } as Point;
    }
    let x = (b1 - b2) / (m2 - m1);
    const y = Math.round(m1 * x + b1);
    x = Math.round(x);
    return { x, y } as Point;
  }
}
