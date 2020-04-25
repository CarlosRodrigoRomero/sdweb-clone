import { Component, OnInit, Input } from '@angular/core';
import 'fabric';
import { GLOBAL } from '../../services/global';
import { Point } from '@agm/core/services/google-maps-types';
import { PcInterface } from '../../models/pc';
import { InformeService } from '../../services/informe.service';
import { ArchivoVueloInterface } from '../../models/archivoVuelo';
import { take } from 'rxjs/operators';
import { EstructuraInterface } from 'src/app/models/estructura';
import { LatLngLiteral } from '@agm/core/map-types';
import { PlantaInterface } from '../../models/planta';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from 'src/app/models/elementoPlanta';
import { Estructura } from '../../models/estructura';

declare let fabric;

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
})
export class CanvasComponent implements OnInit {
  @Input() pcsOrEstructuras: boolean;
  @Input() carpetaJpgGray: string;
  @Input() allPcs: PcInterface[];
  @Input() currentLatLng: LatLngLiteral;

  @Input() set planta$(obs: Observable<PlantaInterface>) {
    obs.pipe(take(1)).subscribe((planta) => {
      this.planta = planta;
      this.filasPorDefecto = planta.filas;
      this.columnasPorDefecto = planta.columnas;
      console.log('asdasd');
    });
  }

  private currentImageRotation: number;
  private backgroundImage: any;
  private selectedStrokeWidth: number;
  informeId: string;
  rectRefReduction: number;
  filasPorDefecto: number;
  columnasPorDefecto: number;
  canvas: any;
  imageWidth: number;
  imageHeight: number;
  selectedElement: ElementoPlantaInterface;
  selectedPc: PcInterface;
  estructuraMatrix: any[];
  currentArchivoVuelo: ArchivoVueloInterface;
  min = 99;
  max = 999999;
  polygonMode = false;
  pointArray = new Array();
  lineArray = new Array();
  activeLine;
  activeShape: any = false;
  sentidoEstructura = true;
  estructura: Estructura;
  planta: PlantaInterface;
  globalCoordsEstructura: number[];

  constructor(private informeService: InformeService, private route: ActivatedRoute) {
    this.imageWidth = GLOBAL.resolucionCamara[1];
    this.imageHeight = GLOBAL.resolucionCamara[0];
    this.selectedStrokeWidth = 2; // Tiene que ser par
    this.rectRefReduction = 0.2;
    this.informeId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.estructura = null;
    this.canvas = new fabric.Canvas('mainCanvas', {
      fireRightClick: true,
      stopContextMenu: true,
    });
    this.initCanvas();
    this.globalCoordsEstructura = [0, 1, 2];

    // Selección de elemento de planta
    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      if (this.selectedElement !== elementoPlanta) {
        this.selectElementoPlanta(elementoPlanta);
      }
    });

    // Selección de archivo vuelo

    this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
      if (this.currentArchivoVuelo !== archivoVuelo) {
        this.selectArchivoVuelo(archivoVuelo);
      }
    });
  }

  selectElementoPlanta(elementoPlanta: ElementoPlantaInterface): void {
    this.selectedElement = elementoPlanta;
    const archivoVuelo = { archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface;
    this.selectArchivoVuelo(archivoVuelo);
    // Dibujar los elementos correspondientes en el canvas
    // Si es un PC:
  }

  selectArchivoVuelo(archivoVuelo: ArchivoVueloInterface): void {
    this.currentArchivoVuelo = archivoVuelo;
    // Borramos todos los elementos que pudiera haber si es necesario
    this.canvas.clear();

    // Ponemos la imagen de fondo
    this.setBackgroundImage(
      this.informeService.getImageUrl(this.carpetaJpgGray, archivoVuelo.vuelo, archivoVuelo.archivo)
    );

    // Añadir Estructura
    this.informeService
      .getEstructuraInforme(this.informeId, archivoVuelo.archivo)
      .pipe(take(1))
      .subscribe((est) => {
        if (est.length > 0 && this.currentArchivoVuelo.archivo === est[0].archivo) {
          this.dibujarEstructura(est[0]);
        } else {
          this.estructura = null;
        }
      });

    this.selectedPc = null;

    // Dibujamos los elementosPlanta que haya...
    // Añadir cuadrados de los pc
    // if (this.pcsOrEstructuras) {
    //   this.allPcs
    //     .filter((pc) => {
    //       return pc.archivo === archivoVuelo.archivo;
    //     })
    //     .forEach((pc) => {
    //       this.drawPcInCanvas(pc);
    //     });
    // }
  }

  setBackgroundImage(imgSrc) {
    const leftAndTop = this.getLeftAndTop(0);

    this.canvas.getObjects().forEach((obj) => {
      this.canvas.remove(obj);
    });

    fabric.Image.fromURL(imgSrc, (image) => {
      // add background image
      if (this.backgroundImage) {
        this.canvas.remove(this.backgroundImage);
      }
      this.canvas.setBackgroundImage(image, this.canvas.renderAll.bind(this.canvas), {
        // scaleX: this.canvas.width / image.width,
        // scaleY: this.canvas.height / image.height,
        crossOrigin: 'anonymous',
        angle: this.currentImageRotation,
        left: leftAndTop.left,
        top: leftAndTop.top,
        selectable: false,
        // originX: 'top',
        // originY: 'left'
      });
      this.backgroundImage = image;
    });
  }

  private dibujarPuntosInterioresEst(estructura: EstructuraInterface): void {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.hasOwnProperty('puntoInteriorEst')) {
        this.canvas.remove(obj);
      }
      this.canvas.renderAll();
    });
    // Calcula los puntos interiores
    const estructuraMatrix = this.getAllPointsEstructura(estructura);
    estructuraMatrix.forEach((fila) => {
      fila.forEach((punto) => {
        this.canvas.add(
          new fabric.Circle({
            left: punto.x - 1,
            top: punto.y - 1,
            radius: 2,
            fill: '#72FD03 ',
            selectable: false,
            estructura: true,
            hoverCursor: 'default',
            puntoInteriorEst: true,
          })
        );
      });
    });

    this.canvas.on('object:modified', (options) => {
      // console.log('object moving desconocido');
      if (this.estructura !== null && options.target.ref === false) {
        const puntoDistMin = this.getPointDistanciaMin(options.pointer.x, options.pointer.y, estructuraMatrix);
        options.target.set({
          left: puntoDistMin.x,
          top: puntoDistMin.y,
        });
      }
    });
  }

  getPointDistanciaMin(x: number, y: number, estructuraMatrix: any[]) {
    let distanciaMinima = 99999;
    let puntoDistanciaMin;

    estructuraMatrix.forEach((filaEst) => {
      filaEst.forEach((punto) => {
        const distancia = Math.abs(punto.x - x) + Math.abs(punto.y - y);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          puntoDistanciaMin = punto;
        }
      });
    });

    let fila;
    let columna;

    [fila, columna] = this.calcularFilaColumna(puntoDistanciaMin.x + 10, puntoDistanciaMin.y + 10);

    this.selectedPc.local_x = columna;
    this.selectedPc.local_y = fila;

    return puntoDistanciaMin;
  }

  private calcularFilaColumna(x: number, y: number) {
    let distanciaMinima = 999999;
    let columnaDistMin;
    let filaDistMin;

    for (let fila = 1; fila < this.estructura.filas + 1; fila++) {
      for (let col = 1; col < this.estructura.columnas + 1; col++) {
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

  updateEstructura(filasColumnas = false) {
    if (filasColumnas) {
      this.filasPorDefecto = this.estructura.filas;
      this.columnasPorDefecto = this.estructura.columnas;
    }

    // Borramos del canvas la estructura anterior.
    this.limpiarEstructuraCanvas();
    this.dibujarEstructura(this.estructura);
    this.informeService.updateEstructura(this.informeId, this.estructura);
  }

  dibujarEstructura(estructura: Estructura) {
    this.estructura = estructura;
    // Dibujar poligono exterior
    const polygon = new fabric.Polygon(estructura.coords, {
      fill: 'rgba(0,0,0,0)',
      stroke: '#72FD03',
      strokeWidth: 2,
      selectable: false,
      objectCaching: false,
      estructura: true,
      hoverCursor: 'default',
    });

    this.canvas.add(polygon);

    estructura.coords.forEach((point, index) => {
      const circle = new fabric.Circle({
        radius: 5,
        fill: '#FE1801',
        left: point.x,
        top: point.y,
        originX: 'center',
        originY: 'center',
        hasBorders: false,
        hasControls: false,
        name: index,
        estructura: true,
        esquinaEstructura: true,
        estructuraId: estructura.id,
      });
      this.canvas.add(circle);
    });
    this.canvas.renderAll();

    // Dibujar puntos interiores
    this.dibujarPuntosInterioresEst(estructura);

    // Event Listener: Cuando se modifique el objeto...
    this.canvas.on('object:modified', (options) => {
      const p = options.target;
      if (p.hasOwnProperty('estructuraId')) {
        if (p.estructuraId === estructura.id) {
          polygon.points[p.name] = { x: p.getCenterPoint().x, y: p.getCenterPoint().y };
          estructura.coords = polygon.points;
          this.informeService.updateEstructura(this.informeId, estructura);

          this.dibujarPuntosInterioresEst(estructura);
        }
      }
    });
  }
  // private updateEstructura() {
  //   if (this.estructura.archivo === this.currentFileName) {
  //     this.filasEstructura = this.estructura.filas;
  //     this.columnasEstructura = this.estructura.columnas;
  //     this.sentidoEstructura = this.estructura.sentido;
  //     this.informeService.updateEstructura(this.informe.id, this.estructura);
  //     this.setImageFromRangeValue(this.rangeValue);
  //   }
  // }

  private getAllPointsEstructura(estructura: EstructuraInterface) {
    this.estructuraMatrix = [];
    for (let i = 0; i < estructura.filas + 1; i++) {
      this.estructuraMatrix[i] = new Array(estructura.columnas + 1);
    }

    const ladosEstructura = [];

    // 1 - Obtenemos coords (x,y) de los cuatro lados
    // [0, 1, 2, 3] == [tl, tr, br, bl] el poligono tiene 4 esquinas

    for (let i = 0; i < 4; i++) {
      // para cada esquina ...
      const p1a = estructura.coords[i];
      let p2a = estructura.coords[i + 1];

      let numeroDivisiones: number;
      if (i === 0) {
        // top-left/bottom-right, inicio de columna
        numeroDivisiones = estructura.columnas;
        this.estructuraMatrix[0][0] = p1a;
      } else if (i === 1) {
        // top-right
        numeroDivisiones = estructura.filas;
        this.estructuraMatrix[0][estructura.columnas] = p1a;
      } else if (i === 2) {
        // bottom-right
        numeroDivisiones = estructura.columnas;
        this.estructuraMatrix[estructura.filas][estructura.columnas] = p1a;
      } else if (i === 3) {
        // bottom-left
        numeroDivisiones = estructura.filas;
        this.estructuraMatrix[estructura.filas][0] = p1a;
        // si la esquina es la numero 3 (bottom-left), entonces p2 es top-left
        p2a = estructura.coords[0];
      }

      // Obtenemos la ecuacion de la recta (y = mx+b)

      const m = (p2a.y - p1a.y) / (p2a.x - p1a.x);
      const b = isFinite(m) ? p2a.y - m * p2a.x : p1a.x;

      ladosEstructura[i] = [m, b];
    }

    // Creamos estas variables auxiliars más faciles de manejar
    const bl = this.estructuraMatrix[estructura.filas][0];
    const br = this.estructuraMatrix[estructura.filas][estructura.columnas];
    const tl = this.estructuraMatrix[0][0];
    const tr = this.estructuraMatrix[0][estructura.columnas];

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
    const divFilas = Math.abs(p0.x - p2.x) / estructura.filas;
    for (let fila = 1; fila < estructura.filas; fila++) {
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

      this.estructuraMatrix[fila][0] = p5;
      this.estructuraMatrix[fila][estructura.columnas] = p6;
    }

    // 6b - Para cada columna
    // 6b.1 Dividir en c=columnas partes iguales el segmento p1-p3
    const divColumnas = Math.abs(p1.x - p3.x) / estructura.columnas;
    for (let col = 1; col < estructura.columnas; col++) {
      // 6b.2 Hallar Recta4 interseccion de dicho punto con pf2
      const sentido = p3.x > p1.x ? -1 : 1;

      const xDiv = p3.x + sentido * col * divColumnas;
      const yDiv = xDiv * r2m + r2b;
      const pDiv = { x: xDiv, y: yDiv } as Point;

      const [r4m, r4b] = this.rectaPor2Puntos(pf2, pDiv);
      // 6b.2 Hallar interseccion de Recta4 con lado inferior (p7) y lado superior (p8)
      const p7 = this.interseccionRectas(r4m, r4b, ladosEstructura[2][0], ladosEstructura[2][1]);
      const p8 = this.interseccionRectas(r4m, r4b, ladosEstructura[0][0], ladosEstructura[0][1]);

      this.estructuraMatrix[0][col] = p8;
      this.estructuraMatrix[estructura.filas][col] = p7;
    }

    // 7 - Obtener puntos interseccion de las lineas rectas

    for (let col = 1; col < estructura.columnas; col++) {
      // obtener la recta
      const p1a = this.estructuraMatrix[0][col];
      const p2a = this.estructuraMatrix[estructura.filas][col];

      const [ma, ba] = this.rectaPor2Puntos(p1a, p2a);

      // para cada fila ...
      for (let fila = 1; fila < estructura.filas; fila++) {
        // obtener la recta
        const p1b = this.estructuraMatrix[fila][0];
        const p2b = this.estructuraMatrix[fila][estructura.columnas];

        const [mb, bb] = this.rectaPor2Puntos(p1b, p2b);

        // hallar interseccion
        const pInterseccion = this.interseccionRectas(ma, ba, mb, bb);

        // almacenar en arrayEstructura
        this.estructuraMatrix[fila][col] = {
          x: Math.round(pInterseccion.x),
          y: Math.round(pInterseccion.y),
        };
      }
    }

    return this.estructuraMatrix;
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

  private drawPcInCanvas(pc: PcInterface) {
    const rect2 = new fabric.Rect({
      left: pc.img_left,
      top: pc.img_top,
      fill: 'rgba(0,0,0,0)',
      stroke: 'red',
      strokeWidth: 0,
      hasControls: false,
      width: pc.img_width,
      height: pc.img_height,
      local_id: pc.local_id,
      ref: false,
      hasRotatingPoint: false,
    });
    const rectRef2 = new fabric.Rect({
      left: pc.refLeft,
      top: pc.refTop,
      fill: 'rgba(0,0,0,0)',
      stroke: 'red',
      strokeWidth: 0,
      hasControls: false,
      width: pc.refWidth,
      height: pc.refHeight,
      local_id: pc.local_id,
      ref: false,
      hasRotatingPoint: false,
    });

    const transformedRect = this.transformActObjToRotated(rect2);
    const transformedRectRef = this.transformActObjToRotated(rectRef2);
    const strokeWidth = pc.local_id === this.selectedPc.local_id ? this.selectedStrokeWidth : 1;

    const rect = new fabric.Rect({
      left: transformedRect.left,
      top: transformedRect.top,
      fill: 'rgba(0,0,0,0)',
      stroke: pc.local_id === this.selectedPc.local_id ? 'white' : 'red',
      strokeWidth,
      hasControls: true,
      width: transformedRect.width - strokeWidth,
      height: transformedRect.height - strokeWidth,
      local_id: pc.local_id,
      ref: false,
      hasRotatingPoint: false,
    });

    const rectRef = new fabric.Rect({
      left: transformedRectRef.left,
      top: transformedRectRef.top,
      fill: 'rgba(0,0,0,0)',
      stroke: 'blue',
      strokeWidth,
      hasControls: true,
      width: transformedRectRef.width - strokeWidth,
      height: transformedRectRef.height - strokeWidth,
      local_id: pc.local_id,
      ref: true,
      selectable: pc.local_id === this.selectedPc.local_id,
      hasRotatingPoint: false,
    });

    this.canvas.add(rect);
    this.canvas.add(rectRef);
    if (pc.local_id === this.selectedPc.local_id) {
      this.canvas.setActiveObject(rect);
    }
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

  private transformActObjToRotated(actObj) {
    let left: number;
    let top: number;
    let width: number;
    let height: number;

    // Los angulos de rotacion son positivos en sentido horario
    if (this.currentImageRotation === 270 || this.currentImageRotation === -90) {
      top = this.imageWidth - actObj.left - actObj.width;
      left = actObj.top;
      width = actObj.height;
      height = actObj.width;
    } else if (this.currentImageRotation === 180) {
      left = this.imageWidth - actObj.left - actObj.width;
      top = this.imageHeight - actObj.top - actObj.height;
      width = actObj.width;
      height = actObj.height;
    } else if (this.currentImageRotation === 90) {
      top = actObj.left;
      left = this.imageHeight - actObj.top - actObj.width;
      width = actObj.height;
      height = actObj.width;
    } else {
      left = actObj.left;
      top = actObj.top;
      width = actObj.width;
      height = actObj.height;
    }

    return { left, top, width, height };
  }

  //////////////////////////////////////////////////////////////////
  ////////////////////// CANVAS LISTENERS //////////////////////
  //////////////////////////////////////////////////////////////////

  // initCanvasListeners() {
  //   this.canvas.on('mouse:up', (options) => {
  //     if (options.target !== null) {
  //       if (options.target.hasOwnProperty('local_id')) {
  //         const selectedPc = this.allPcs.find((item) => item.local_id === options.target.local_id);
  //         this.canvas.setActiveObject(options.target);
  //         this.onMapMarkerClick(selectedPc);
  //       }
  //     }
  //   });

  //   this.canvas.on('object:modified', (options) => {
  //     // En el caso de que sea un
  //     if (options.target.type === 'rect') {
  //       const actObjRaw = this.transformActObjToRaw(options.target);
  //       this.selectPcFromLocalId(options.target.local_id);

  //       if (actObjRaw.ref === true) {
  //         this.selected_pc.refTop = Math.round(actObjRaw.top);

  //         this.selected_pc.refLeft = Math.round(actObjRaw.left);
  //         this.selected_pc.refWidth = Math.round(
  //           Math.abs(actObjRaw.aCoords.tr.x - actObjRaw.aCoords.tl.x) - actObjRaw.strokeWidth / 2
  //         );
  //         this.selected_pc.refHeight = Math.round(
  //           Math.abs(actObjRaw.aCoords.bl.y - actObjRaw.aCoords.tl.y) - actObjRaw.strokeWidth / 2
  //         );
  //       } else {
  //         this.selected_pc.img_top = Math.round(actObjRaw.top);
  //         this.selected_pc.img_left = Math.round(actObjRaw.left);
  //         this.selected_pc.img_width = Math.round(
  //           Math.abs(actObjRaw.aCoords.tr.x - actObjRaw.aCoords.tl.x) - actObjRaw.strokeWidth / 2
  //         );
  //         this.selected_pc.img_height = Math.round(
  //           Math.abs(actObjRaw.aCoords.bl.y - actObjRaw.aCoords.tl.y) - actObjRaw.strokeWidth / 2
  //         );
  //       }
  //       this.updatePcInDb(this.selected_pc);
  //     } else if (options.target.type === 'polygon') {
  //       console.log('options.target', options.target);
  //     }

  //     // this.canvas.on('object:modified', this.onObjectModified);
  //   });
  // }

  // onDblClickCanvas(event) {
  //   let fila: number;
  //   let columna: number;
  //   let height: number;
  //   let width: number;
  //   let top: number;
  //   let bottom: number;
  //   let left: number;
  //   let right: number;
  //   // Referencia
  //   let topLeftRef: Point;
  //   let topRightRef: Point;
  //   let bottomLeftRef: Point;
  //   let bottomRightRef: Point;
  //   let topRef: number;
  //   let leftRef: number;
  //   let heightRef: number;
  //   let widthRef: number;
  //   let columnaReal: number;
  //   let filaReal: number;

  //   if (this.estructura !== null) {
  //     [fila, columna] = this.calcularFilaColumna(event.offsetX, event.offsetY);
  //     [columnaReal, filaReal] = this.getLocalCoordsFromEstructura(columna, fila, this.estructura);

  //     const topLeftModulo = this.estructuraMatrix[fila - 1][columna - 1];
  //     const topRightModulo = this.estructuraMatrix[fila - 1][columna];
  //     const bottomRightModulo = this.estructuraMatrix[fila][columna];
  //     const bottomLeftModulo = this.estructuraMatrix[fila][columna - 1];
  //     if (this.estructura.columnas === 1) {
  //       if (fila === this.estructura.filas) {
  //         topLeftRef = this.estructuraMatrix[fila - 2][columna - 1];
  //         topRightRef = this.estructuraMatrix[fila - 2][columna];

  //         bottomRightRef = topRightModulo;
  //         bottomLeftRef = topLeftModulo;
  //       } else {
  //         topLeftRef = bottomLeftModulo;
  //         topRightRef = bottomRightModulo;

  //         bottomRightRef = this.estructuraMatrix[fila + 1][columna];
  //         bottomLeftRef = this.estructuraMatrix[fila + 1][columna - 1];
  //       }
  //     } else {
  //       if (columna === this.estructura.columnas) {
  //         topLeftRef = this.estructuraMatrix[fila - 1][columna - 2];
  //         bottomLeftRef = this.estructuraMatrix[fila][columna - 2];
  //         topRightRef = topLeftModulo;
  //         bottomRightRef = bottomLeftModulo;
  //       } else {
  //         topLeftRef = topRightModulo;
  //         bottomLeftRef = bottomRightModulo;
  //         topRightRef = this.estructuraMatrix[fila - 1][columna + 1];
  //         bottomRightRef = this.estructuraMatrix[fila][columna + 1];
  //       }
  //     }

  //     top = Math.round(0.5 * (topLeftModulo.y + topRightModulo.y));
  //     bottom = Math.round(0.5 * (bottomLeftModulo.y + bottomRightModulo.y));
  //     left = Math.round(0.5 * (topLeftModulo.x + bottomLeftModulo.x));
  //     right = Math.round(0.5 * (topRightModulo.x + bottomRightModulo.x));
  //     height = Math.round(Math.abs(bottom - top) + 2) + 1;
  //     width = Math.round(Math.abs(right - left)) + 1;

  //     this.setSquareBase(Math.min(height, width));

  //     //   Ref
  //     topRef = Math.max(topLeftRef.y, topRightRef.y);
  //     leftRef = Math.max(topLeftRef.x, bottomLeftRef.x);
  //     heightRef = Math.min(bottomLeftRef.y, bottomRightRef.y) - topRef + 1;
  //     widthRef = Math.min(topRightRef.x, bottomRightRef.x) - leftRef + 1;

  //     leftRef = Math.round(leftRef + (widthRef * this.rectRefReduction) / 2);
  //     topRef = Math.round(topRef + (heightRef * this.rectRefReduction) / 2);
  //     widthRef = Math.round(widthRef * (1 - this.rectRefReduction)) + 1;
  //     heightRef = Math.round(heightRef * (1 - this.rectRefReduction)) + 1;
  //   } else {
  //     filaReal = 0;
  //     columnaReal = 1;

  //     top = event.offsetY - this.squareHeight / 2;
  //     left = event.offsetX - this.squareWidth / 2;
  //     height = this.squareHeight;
  //     width = this.squareWidth;

  //     leftRef = left + width * (1 + this.rectSeparation) + (width * this.rectRefReduction) / 2;
  //     topRef = top + (height * this.rectRefReduction) / 2;
  //     widthRef = width * (1 - this.rectRefReduction);
  //     heightRef = height * (1 - this.rectRefReduction);
  //   }

  //   // Localizaciones
  //   let globalX;
  //   let globalY;
  //   let modulo_;

  //   [globalX, globalY, modulo_] = this.getGlobalCoordsFromLocationArea({
  //     lat: this.current_gps_lat,
  //     lng: this.current_gps_lng,
  //   });

  //   // Creamos el nuevo PC
  //   this.localIdCount += 1;

  //   const newPc: PcInterface = {
  //     id: '',
  //     archivo: this.currentFileName,
  //     tipo: GLOBAL.anomaliaPorDefecto, // tipo (diodo bypass por defecto)
  //     local_x: columnaReal, // local_x
  //     local_y: filaReal, // local_x
  //     global_x: globalX, // global_x
  //     global_y: globalY, // global_y
  //     gps_lng: this.current_gps_lng,
  //     gps_lat: this.current_gps_lat,
  //     img_left: left,
  //     img_top: top,
  //     img_width: width,
  //     img_height: height,
  //     img_x: 0, // coordenadas raw del punto mas caliente
  //     img_y: 0, // coordenadas raw del punto mas caliente
  //     local_id: this.localIdCount,
  //     vuelo: this.currentFlight,
  //     image_rotation: this.current_image_rotation,
  //     informeId: this.informe.id,
  //     datetime: this.current_datetime,
  //     resuelto: false,
  //     color: 'black',
  //     refLeft: leftRef,
  //     refTop: topRef,
  //     refHeight: heightRef,
  //     refWidth: widthRef,
  //     modulo: modulo_,
  //   };

  //   //

  //   if (this.selected_pc) {
  //     this.selected_pc.color = 'black';
  //     if (this.selected_pc.archivo === newPc.archivo) {
  //       newPc.refHeight = this.selected_pc.refHeight;
  //       newPc.refWidth = this.selected_pc.refWidth;
  //       newPc.refTop = this.selected_pc.refTop;
  //       newPc.refLeft = this.selected_pc.refLeft;
  //     }
  //     if (this.selected_pc.archivo === newPc.archivo && this.planta.tipo === 'seguidores') {
  //       newPc.global_x = this.selected_pc.global_x;
  //       newPc.global_y = this.selected_pc.global_y;
  //       newPc.gps_lng = this.selected_pc.gps_lng;
  //       newPc.gps_lat = this.selected_pc.gps_lat;
  //     }
  //     if (this.selected_pc.archivo === newPc.archivo && this.estructura.columnas === 1) {
  //       newPc.local_x = this.selected_pc.local_x;
  //     }
  //   }

  //   this.addPcToDb(newPc);
  //   this.drawPcInCanvas(newPc);
  //   this.onMapMarkerClick(newPc);
  // }

  // onMouseUpCanvas(event) {
  //   const actObj = this.canvas.getActiveObject();

  //   // PCS
  //   if (actObj !== null && actObj !== undefined) {
  //     if (actObj.get('type') === 'rect') {
  //       this.selectedElement = this.allPcs.find((pc) => pc.local_id === actObj.localId);

  //     }
  //   }

  //   // ESTRUCTURAS
  // }

  deleteEstructura() {
    this.informeService.avisadorNuevoElementoSource.next(this.estructura);
    this.informeService.deleteEstructuraInforme(this.informeId, this.currentArchivoVuelo.archivo);
    // Borrar estructura de
    this.estructura = null;
    this.limpiarEstructuraCanvas();
  }

  private getLeftAndTop(imageRotation: number) {
    if (imageRotation === 90) {
      return {
        left: this.imageHeight,
        top: 0,
        height: this.imageWidth,
        width: this.imageHeight,
      };
    } else if (imageRotation === 180) {
      return {
        left: this.imageWidth,
        top: this.imageHeight,
        height: this.imageHeight,
        width: this.imageWidth,
      };
    } else if (imageRotation === 270) {
      return {
        left: 0,
        top: this.imageWidth,
        height: this.imageWidth,
        width: this.imageHeight,
      };
    } else {
      return {
        left: 0,
        top: 0,
        height: this.imageHeight,
        width: this.imageWidth,
      };
    }
  }

  private limpiarEstructuraCanvas() {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.hasOwnProperty('estructura')) {
        this.canvas.remove(obj);
      }
    });
  }

  initCanvas() {
    this.canvas.on('mouse:down', (options) => {
      if (options.button === 3 && !this.polygonMode) {
        this.drawPolygon();
      }
      if (this.pointArray.length === 3) {
        console.log('ENDED 4 LADOS');
        this.addPoint(options);
        this.generatePolygon(this.pointArray);
      } else if (options.target && options.target.id === this.pointArray[0].id) {
        this.generatePolygon(this.pointArray);
      }
      if (this.polygonMode) {
        this.addPoint(options);
      }
    });
    this.canvas.on('mouse:up', (options) => {});
    this.canvas.on('mouse:move', (options) => {
      if (this.activeLine && this.activeLine.class === 'line') {
        const pointer = this.canvas.getPointer(options.e);
        this.activeLine.set({ x2: pointer.x, y2: pointer.y });

        const points = this.activeShape.get('points');
        points[this.pointArray.length] = {
          x: pointer.x,
          y: pointer.y,
        };
        this.activeShape.set({
          points,
        });
        this.canvas.renderAll();
      }
      this.canvas.renderAll();
    });
  }

  public drawPolygon() {
    // Borrar posibles restos de polígonos anteriores
    if (this.estructura) {
      this.deleteEstructura();
    }
    //

    this.polygonMode = true;
    this.pointArray = new Array();
    this.lineArray = new Array();
    //  this.activeLine;
  }

  private addPoint(options) {
    const random = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    const id = new Date().getTime() + random;
    const circle = new fabric.Circle({
      radius: 5,
      fill: '#ffffff',
      stroke: '#333333',
      strokeWidth: 0.5,
      left: options.e.layerX / this.canvas.getZoom(),
      top: options.e.layerY / this.canvas.getZoom(),
      selectable: false,
      hasBorders: false,
      hasControls: false,
      originX: 'center',
      originY: 'center',
      id,
      objectCaching: false,
    });
    if (this.pointArray.length === 0) {
      circle.set({
        fill: 'red',
      });
    }

    const points1 = [
      options.e.layerX / this.canvas.getZoom(),
      options.e.layerY / this.canvas.getZoom(),
      options.e.layerX / this.canvas.getZoom(),
      options.e.layerY / this.canvas.getZoom(),
    ];

    const line = new fabric.Line(points1, {
      strokeWidth: 2,
      fill: '#72FD03',
      stroke: '#72FD03',
      class: 'line',
      originX: 'center',
      originY: 'center',
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
      objectCaching: false,
    });
    if (this.activeShape) {
      const pos = this.canvas.getPointer(options.e);
      const points2 = this.activeShape.get('points');
      points2.push({
        x: pos.x,
        y: pos.y,
      });

      const polygon1 = new fabric.Polygon(points2, {
        stroke: '#333333',
        strokeWidth: 1,
        fill: '#cccccc',
        opacity: 0.3,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
        objectCaching: false,
      });
      this.canvas.remove(this.activeShape);
      this.canvas.add(polygon1);
      this.activeShape = polygon1;
      this.canvas.renderAll();
    } else {
      const polyPoint = [{ x: options.e.layerX / this.canvas.getZoom(), y: options.e.layerY / this.canvas.getZoom() }];
      const polygon2 = new fabric.Polygon(polyPoint, {
        stroke: '#333333',
        strokeWidth: 1,
        fill: '#cccccc',
        opacity: 0.3,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
        objectCaching: false,
      });
      this.activeShape = polygon2;
      this.canvas.add(polygon2);
    }
    this.activeLine = line;

    this.pointArray.push(circle);
    this.lineArray.push(line);

    this.canvas.add(line);
    this.canvas.add(circle);
    this.canvas.selection = false;
  }
  private generatePolygon(pointArray) {
    const points = new Array();
    pointArray.forEach((point) => {
      points.push({
        x: point.left,
        y: point.top,
      });
      this.canvas.remove(point);
    });
    this.lineArray.forEach((line) => {
      this.canvas.remove(line);
    });
    this.canvas.remove(this.activeShape).remove(this.activeLine);

    // Aqui ya tenemos los punts de la estructura (points)
    // Crear nueva estructura en la base de datos
    // TODO: arreglar globalCoords, filaInicio y columnaInicio

    const nuevaEstructura = {
      archivo: this.currentArchivoVuelo.archivo,
      coords: points,
      filas: this.filasPorDefecto,
      columnas: this.columnasPorDefecto,
      sentido: this.sentidoEstructura, // false: izq->drcha | true: drcha -> izq
      columnaInicio: 1,
      filaInicio: 1,
      vuelo: this.currentArchivoVuelo.vuelo,
      latitud: this.currentLatLng.lat,
      longitud: this.currentLatLng.lng,
      globalCoords: [null, null, null],
    } as EstructuraInterface;

    const nuevaEstructuraObj = new Estructura(nuevaEstructura);

    // Dibujar dicha estructura
    this.dibujarEstructura(nuevaEstructuraObj);

    // Añadir a la base de datos
    this.informeService.addEstructuraInforme(this.informeId, nuevaEstructuraObj);

    this.activeLine = null;
    this.activeShape = null;
    this.polygonMode = false;
    this.canvas.selection = true;
  }
}
