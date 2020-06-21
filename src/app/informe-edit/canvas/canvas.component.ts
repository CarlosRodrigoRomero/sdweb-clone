import { Component, OnInit, Input } from '@angular/core';
import 'fabric';
import { GLOBAL } from '../../services/global';
import { Point } from '@agm/core/services/google-maps-types';
import { PcInterface, Pc } from '../../models/pc';
import { InformeService } from '../../services/informe.service';
import { ArchivoVueloInterface } from '../../models/archivoVuelo';
import { take } from 'rxjs/operators';
import { EstructuraInterface } from 'src/app/models/estructura';
import { LatLngLiteral } from '@agm/core/map-types';
import { PlantaInterface } from '../../models/planta';
import { Observable, Subscription, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from 'src/app/models/elementoPlanta';
import { Estructura, RectanguloInterface } from '../../models/estructura';
import { PlantaService } from '../../services/planta.service';
import { ModuloInterface } from '../../models/modulo';
import { PcService } from '../../services/pc.service';

declare let fabric;

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
})
export class CanvasComponent implements OnInit {
  @Input() pcsOrEstructuras: boolean;
  @Input() carpetaJpgGray: string;
  @Input() currentLatLng: LatLngLiteral;
  @Input() currentDatetime: number;
  @Input() currentTrackheading: number;
  @Input() currentImageRotation: number;

  @Input() set planta$(obs: Observable<PlantaInterface>) {
    obs.pipe(take(1)).subscribe((planta) => {
      this.planta = planta;
      this.filasPorDefecto = planta.filas;
      this.columnasPorDefecto = planta.columnas;
      this.setSquareBase(planta, this.squareBase);
    });
  }

  private selectedStrokeWidth: number;
  private currentArchivoVuelo: ArchivoVueloInterface;
  private setBackgroundImage$: Subscription;
  informeId: string;
  rectRefReduction: number;
  filasPorDefecto: number;
  columnasPorDefecto: number;
  canvas: any;
  imageWidth: number;
  imageHeight: number;
  selectedPc: PcInterface;
  min = 99;
  max = 999999;
  polygonMode = false;
  pointArray = new Array();
  lineArray = new Array();
  private activeLine;
  private activeShape: any = false;
  sentidoPorDefecto = false;
  estructura: Estructura;
  planta: PlantaInterface;
  allPcs: Pc[];
  private squareBase: number;
  private squareProp: number;
  private squareHeight: number;
  private squareWidth: number;
  private rectSeparation = 0.1;
  private localIdCount: number;
  global = GLOBAL;
  public successMessage: string;
  public alertMessage: string;

  constructor(
    public informeService: InformeService,
    private route: ActivatedRoute,
    private plantaService: PlantaService,
    private pcService: PcService
  ) {}

  ngOnInit(): void {
    this.imageWidth = GLOBAL.resolucionCamara[1];
    this.imageHeight = GLOBAL.resolucionCamara[0];
    this.selectedStrokeWidth = 2; // Tiene que ser par
    this.rectRefReduction = 0.2;
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.squareBase = 37;
    this.squareProp = 1.8;

    this.pcService.getPcsInformeEdit(this.informeId).subscribe((allPcs) => {
      this.allPcs = allPcs;
      if (this.allPcs.length > 0) {
        this.localIdCount = allPcs.sort(this.pcService.sortByLocalId)[allPcs.length - 1].local_id;
      } else {
        this.localIdCount = 0;
      }
      // this.allPcs.forEach((pc) => {
      //   console.log('CanvasComponent -> ngOnInit -> pc', pc.id);
      //   this.pcService.updatePc(pc);
      // });
    });

    this.estructura = null;

    this.initCanvas();
    this.currentArchivoVuelo = { archivo: '', vuelo: '' };

    // Selección de elemento de planta
    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      this.selectElementoPlanta(elementoPlanta);
    });

    // Selección de archivo vuelo

    this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
      this.selectArchivoVuelo(archivoVuelo);
    });

    this.informeService.avisadorChangeElemento$.subscribe((elem) => {
      if (elem.constructor.name === Estructura.name && this.informeService.selectedElementoPlanta.id === elem.id) {
        this.estructura = elem as Estructura;
      }
    });

    this.informeService.avisadorNuevoElemento$.subscribe((elem) => {
      if (elem.constructor.name === Pc.name) {
        this.nuevoPc(elem as Pc);
      } else if (elem.constructor.name === Estructura.name) {
        if (this.estructura === elem) {
          // Borrar estructura del Canvas
          this.estructura = null;
          this.limpiarEstructuraCanvas();
        } else {
          this.dibujarEstructura(elem as Estructura);
          this.informeService.selectElementoPlanta(elem);
        }
      }
    });
  }
  nuevoPc(pc: Pc) {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.hasOwnProperty('ref')) {
        if (obj.id === pc.id) {
          this.canvas.remove(obj);
        }
      }
    });
  }

  selectElementoPlanta(elementoPlanta: ElementoPlantaInterface): void {
    if (elementoPlanta == null) {
      this.estructura = null;
      this.selectedPc = null;
    } else {
      this.selectArchivoVuelo({
        archivo: elementoPlanta.archivo,
        vuelo: elementoPlanta.vuelo,
      } as ArchivoVueloInterface);

      if (elementoPlanta.constructor.name === Estructura.name) {
        if (this.estructura !== elementoPlanta) {
          this.estructura = elementoPlanta as Estructura;
        }
      } else if (elementoPlanta.constructor.name === Pc.name) {
        if (this.selectedPc !== elementoPlanta) {
          this.selectedPc = elementoPlanta as Pc;
          this.selectPcInCanvas(elementoPlanta as Pc);
        }
      }
    }

    // Dibujar los elementos correspondientes en el canvas
    // Si es un PC:
  }

  selectPcInCanvas(elem: Pc) {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.id === elem.id) {
        obj.set('strokeWidth', 3);
      } else {
        obj.set('strokeWidth', 1);
      }
    });
    this.canvas.renderAll();
  }

  addEstructuraCanvas(archivoVuelo: ArchivoVueloInterface) {
    this.informeService
      .getEstructuraInforme(this.informeId, archivoVuelo.archivo)
      .pipe(take(1))
      .subscribe((est) => {
        if (est.length > 0) {
          this.dibujarEstructura(est[0]);
          if (this.informeService.selectedElementoPlanta == null) {
            this.informeService.selectElementoPlanta(est[0]);
          } else if (this.informeService.selectedElementoPlanta.id !== est[0].id) {
            this.informeService.selectElementoPlanta(est[0]);
          }
        }
      });
  }

  addPcsCanvas(archivoVuelo: ArchivoVueloInterface) {
    // Dibujamos los elementosPlanta que haya...
    // Añadir cuadrados de los pc
    if (this.pcsOrEstructuras) {
      this.allPcs
        .filter((pc) => {
          return pc.archivo === archivoVuelo.archivo;
        })
        .forEach((pc) => {
          this.drawPcInCanvas(pc);
        });
    }
  }

  selectArchivoVuelo(archivoVuelo: ArchivoVueloInterface): void {
    // Quitamos nuestra suscripcion
    if (this.setBackgroundImage$ !== undefined) {
      this.setBackgroundImage$.unsubscribe();
    }

    // Ponemos la imagen de fondo
    if (this.currentArchivoVuelo.archivo !== archivoVuelo.archivo) {
      this.currentArchivoVuelo = archivoVuelo;
      this.setBackgroundImage$ = this.setBackgroundImage(
        this.informeService.getImageUrl(this.carpetaJpgGray, archivoVuelo.vuelo, archivoVuelo.archivo)
      )
        .pipe(take(1))
        .subscribe((bool) => {
          if (bool) {
            // Añadir Estructura
            this.addEstructuraCanvas(archivoVuelo);
            this.addPcsCanvas(archivoVuelo);
          }
        });
    }
  }

  setBackgroundImage(imgSrc: string): Observable<boolean> {
    const result = new Subject<boolean>();
    const leftAndTop = this.getLeftAndTop(0);

    fabric.Image.fromURL(imgSrc, (image) => {
      // add background image
      this.canvas.clear();
      this.canvas.setBackgroundImage(image, this.canvas.renderAll.bind(this.canvas), {
        // scaleX: this.canvas.width / image.width,
        // scaleY: this.canvas.height / image.height,
        crossOrigin: 'anonymous',
        angle: this.currentImageRotation,
        left: leftAndTop.left,
        top: leftAndTop.top,
        selectable: false,
      });
      result.next(true);
    });

    return result;
  }

  private dibujarPuntosInterioresEst(estructura: Estructura): void {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.hasOwnProperty('puntoInteriorEst')) {
        this.canvas.remove(obj);
      }
      this.canvas.renderAll();
    });
    // Dibujar los puntos interiores
    estructura.getEstructuraMatrix().forEach((fila) => {
      fila.forEach((punto: Point) => {
        const circle = new fabric.Circle({
          left: punto.x - 2,
          top: punto.y - 2,
          radius: 2,
          fill: '#72FD03 ',
          selectable: false,
          estructura: true,
          hoverCursor: 'default',
          puntoInteriorEst: true,
        });
        this.canvas.add(circle);
        this.canvas.sendToBack(circle);
      });
    });

    // this.canvas.on('object:modified', (options) => {
    //   if (this.estructura !== null && options.target.ref === false) {
    //     const puntoDistMin = this.getPointDistanciaMin(options.pointer.x, options.pointer.y, estructuraMatrix);
    //     options.target.set({
    //       left: puntoDistMin.x,
    //       top: puntoDistMin.y,
    //     });
    //   }
    // });
  }

  updateEstructura(filasColumnas = false) {
    if (filasColumnas) {
      this.filasPorDefecto = this.estructura.filas;
      this.columnasPorDefecto = this.estructura.columnas;
      this.sentidoPorDefecto = this.estructura.sentido;
    }

    // Borramos del canvas la estructura anterior.
    this.limpiarEstructuraCanvas();
    this.dibujarEstructura(this.estructura);
    this.informeService
      .updateElementoPlanta(this.informeId, this.estructura)
      .then((res) => {
        this.successMessage = 'Estructura actualizada - OK';
        setTimeout(() => {
          this.successMessage = undefined;
        }, 2000);
        this.alertMessage = undefined;
      })
      .catch((res) => {
        this.alertMessage = 'Error actualizando estructura';
      });
  }

  dibujarEstructura(estructura: Estructura) {
    // this.estructura = estructura;
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
    this.canvas.sendToBack(polygon);

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
      this.canvas.sendToBack(circle);
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
          this.informeService.updateElementoPlanta(this.informeId, estructura);

          this.dibujarPuntosInterioresEst(estructura);
        }
      }
    });
  }
  // private updateEstructura() {
  //   if (this.estructura.archivo === this.currentFileName) {
  //     this.filasEstructura = this.estructura.filas;
  //     this.columnasEstructura = this.estructura.columnas;
  //     this.sentidoPorDefecto = this.estructura.sentido;
  //     this.informeService.updateEstructura(this.informe.id, this.estructura);
  //     this.setImageFromRangeValue(this.rangeValue);
  //   }
  // }

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
      id: pc.id,
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
      id: pc.id,
      ref: false,
      hasRotatingPoint: false,
    });

    const transformedRect = this.transformActObjToRotated(rect2);
    const transformedRectRef = this.transformActObjToRotated(rectRef2);
    const strokeWidth = 1;

    const rect = new fabric.Rect({
      left: transformedRect.left,
      top: transformedRect.top,
      fill: 'rgba(0,0,0,0)',
      stroke: 'white',
      strokeWidth,
      hasControls: true,
      width: transformedRect.width - strokeWidth,
      height: transformedRect.height - strokeWidth,
      id: pc.id,
      ref: false,
      selectable: true,
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
      id: pc.id,
      ref: true,
      selectable: true,
      hasRotatingPoint: false,
    });

    this.canvas.add(rect);
    this.canvas.add(rectRef);

    this.canvas.renderAll();
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

  initCanvasListeners() {
    // Creacion de pcs con dobleClick
    this.canvas.on('mouse:dblclick', (options) => {
      if (this.pcsOrEstructuras) {
        this.onDblClickCanvas(options.e);
      }
    });

    // Creacion de Est con boton derecho
    this.canvas.on('mouse:down', (options) => {
      if (
        (options.button === 3 || (options.button === 1 && options.e.ctrlKey)) &&
        !this.polygonMode &&
        this.estructura === null
      ) {
        this.drawPolygon();
      }
      if (this.pointArray.length === 3) {
        this.addPoint(options);
        this.generatePolygon(this.pointArray);
      }
      // else if (options.target && options.target.hasOwnProperty('id')) {
      //   if (options.target.id === this.pointArray[0].id) {
      //     this.generatePolygon(this.pointArray);
      //   }
      // }
      if (this.polygonMode) {
        this.addPoint(options);
      }
    });
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
    ///////////////////////////////////////////////////
    this.canvas.on('mouse:down', (options) => {
      // Si es un pc/ref
      if (options.target !== null && options.target.hasOwnProperty('ref')) {
        const selectedPc = this.allPcs.find((item) => item.id === options.target.id);
        this.informeService.selectElementoPlanta(selectedPc);

        ///////////////////
      }
    });
    ///////////////////////////////////////////////////

    // Seleccionar al hacer click
    this.canvas.on('mouse:up', (options) => {});

    this.canvas.on('object:modified', (options) => {
      // En el caso de que sea un
      if (options.target !== null && options.target.hasOwnProperty('ref')) {
        const actObjRaw = this.transformActObjToRaw(options.target);
        // this.selectPcFromLocalId(options.target.local_id);

        if (actObjRaw.ref === true) {
          this.selectedPc.refTop = Math.round(actObjRaw.top);

          this.selectedPc.refLeft = Math.round(actObjRaw.left);
          this.selectedPc.refWidth = Math.round(
            Math.abs(actObjRaw.aCoords.tr.x - actObjRaw.aCoords.tl.x) - actObjRaw.strokeWidth / 2
          );
          this.selectedPc.refHeight = Math.round(
            Math.abs(actObjRaw.aCoords.bl.y - actObjRaw.aCoords.tl.y) - actObjRaw.strokeWidth / 2
          );
        } else {
          this.selectedPc.img_top = Math.round(actObjRaw.top);
          this.selectedPc.img_left = Math.round(actObjRaw.left);
          this.selectedPc.img_width = Math.round(
            Math.abs(actObjRaw.aCoords.tr.x - actObjRaw.aCoords.tl.x) - actObjRaw.strokeWidth / 2
          );
          this.selectedPc.img_height = Math.round(
            Math.abs(actObjRaw.aCoords.bl.y - actObjRaw.aCoords.tl.y) - actObjRaw.strokeWidth / 2
          );
        }
        this.pcService.updatePc(this.selectedPc);
      } else if (options.target.type === 'polygon') {
      }

      // this.canvas.on('object:modified', this.onObjectModified);
    });
  }

  onDblClickCanvas(event: MouseEvent) {
    let fila: number;
    let columna: number;
    let columnaReal: number;
    let filaReal: number;
    let rectInteriorPc: RectanguloInterface;

    // Referencia
    let rectInteriorRef: RectanguloInterface;
    let filaRef: number;
    let columnaRef: number;

    if (this.estructura !== null) {
      [fila, columna] = this.estructura.calcularFilaColumna(event.offsetX, event.offsetY);

      [columnaReal, filaReal] = this.estructura.getLocalCoordsFromEstructura(columna, fila);
      [columnaRef, filaRef] = this.estructura.getFilaColumnaRef(columna, fila);

      if (event.ctrlKey) {
        rectInteriorPc = this.estructura.getRectanguloExterior(columna, fila);
        rectInteriorRef = this.estructura.getRectanguloExterior(columnaRef, filaRef);
      } else {
        rectInteriorPc = this.estructura.getRectanguloInterior(columna, fila);
        rectInteriorRef = this.estructura.getRectanguloInterior(columnaRef, filaRef);
      }

      this.setSquareBase(
        this.planta,
        Math.min(rectInteriorPc.bottom - rectInteriorPc.top, rectInteriorPc.right - rectInteriorPc.left)
      );
    } else {
      filaReal = 0;
      columnaReal = 1;

      const top = event.offsetY - this.squareHeight / 2;
      const left = event.offsetX - this.squareWidth / 2;
      const height = this.squareHeight;
      const width = this.squareWidth;
      rectInteriorPc = { top, left, bottom: top + height, right: left + width };

      const leftRef = Math.round(left + width * (1 + this.rectSeparation) + (width * this.rectRefReduction) / 2);
      const topRef = Math.round(top + (height * this.rectRefReduction) / 2);
      const widthRef = Math.round(width * (1 - this.rectRefReduction));
      const heightRef = Math.round(height * (1 - this.rectRefReduction));
      rectInteriorRef = { top: topRef, left: leftRef, bottom: topRef + heightRef, right: leftRef + widthRef };
    }

    // Localizaciones
    let globalCoords;
    let modulo;
    [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(this.estructura.getLatLng());

    // Creamos el nuevo PC
    this.localIdCount += 1;

    const newPc: PcInterface = {
      id: '',
      archivo: this.informeService.selectedArchivoVuelo.archivo,
      vuelo: this.informeService.selectedArchivoVuelo.vuelo,
      tipo: GLOBAL.anomaliaPorDefecto, // tipo (diodo bypass por defecto)
      local_x: columnaReal, // local_x
      local_y: filaReal, // local_x
      globalCoords, //
      gps_lng: this.currentLatLng.lng,
      gps_lat: this.currentLatLng.lat,
      img_left: rectInteriorPc.left,
      img_top: rectInteriorPc.top,
      img_width: rectInteriorPc.right - rectInteriorPc.left,
      img_height: rectInteriorPc.bottom - rectInteriorPc.top,
      img_x: 0, // coordenadas raw del punto mas caliente
      img_y: 0, // coordenadas raw del punto mas caliente
      local_id: this.localIdCount,
      image_rotation: this.currentImageRotation,
      informeId: this.informeId,
      datetime: this.currentDatetime,
      resuelto: false,
      refLeft: rectInteriorRef.left,
      refTop: rectInteriorRef.top,
      refWidth: rectInteriorRef.right - rectInteriorRef.left,
      refHeight: rectInteriorRef.bottom - rectInteriorRef.top,
      modulo,
    };

    //
    const selectedElem = this.informeService.selectedElementoPlanta;
    if (selectedElem) {
      if (selectedElem.constructor.name === Pc.name) {
        const selectedPc = selectedElem as Pc;
        if (selectedElem.archivo === newPc.archivo) {
          newPc.refHeight = selectedPc.refHeight;
          newPc.refWidth = selectedPc.refWidth;
          newPc.refTop = selectedPc.refTop;
          newPc.refLeft = selectedPc.refLeft;
          if (event.shiftKey) {
            newPc.img_width = selectedPc.img_width;
            newPc.img_height = selectedPc.img_height;
          }
        }
        if (!this.estructura) {
          if (this.selectedPc.archivo === newPc.archivo && this.planta.tipo === 'seguidores') {
            newPc.globalCoords = selectedPc.globalCoords;
            newPc.gps_lng = selectedPc.gps_lng;
            newPc.gps_lat = selectedPc.gps_lat;
          }
          // if (selectedPc.archivo === newPc.archivo && this.estructura.columnas === 1) {
          //   newPc.local_x = selectedPc.local_x;
          // }
        }
      }
    }

    this.pcService.addPc(newPc).then((pcRef) => {
      this.drawPcInCanvas(newPc);
      this.informeService.selectElementoPlanta(new Pc(newPc));
    });
  }

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

  // getPcsList(vuelo?: string) {
  //   this.pcService
  //     .getPcsInformeEdit(this.informe.id)
  //     .pipe(take(1))
  //     .subscribe(
  //       (response) => {
  //         if (!response || response.length === 0) {
  //           this.alertMessage = 'No hay puntos calientes';
  //         } else {
  //           this.alertMessage = null;
  //           this.allPcs = response;
  //           if (vuelo != null) {
  //             this.allPcs = this.sortPcs(this.allPcs).filter((arr) => {
  //               return arr.vuelo === vuelo;
  //             });
  //           } else {
  //             this.allPcs = this.sortPcs(this.allPcs);
  //           }

  //           this.localIdCount = this.allPcs[0].local_id;
  //         }

  //         // if (this.DEFAULT_LAT == null || this.DEFAULT_LNG == null) {
  //         //     this.DEFAULT_LAT = this.allPcs[0].gps_lat;
  //         //     this.DEFAULT_LNG = this.allPcs[0].gps_lng;
  //         // }
  //       },
  //       (error) => {
  //         const errorMessage = error;
  //         if (errorMessage != null) {
  //           const body = JSON.parse(error._body);
  //           this.alertMessage = body.message;
  //           console.log(error);
  //         }
  //       }
  //     );
  // }

  deleteEstructura(estructura: Estructura) {
    this.informeService.deleteEstructuraInforme(this.informeId, estructura);
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

  onClickCrearEstructura() {
    if (!this.polygonMode && this.estructura === null) {
      this.drawPolygon();
    }
  }

  initCanvas() {
    this.canvas = new fabric.Canvas('mainCanvas', {
      fireRightClick: true,
      stopContextMenu: true,
    });

    this.initCanvasListeners();
  }

  public drawPolygon() {
    // Borrar posibles restos de polígonos anteriores
    if (this.estructura) {
      this.deleteEstructura(this.estructura);
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
    let globalCoords;
    let modulo;
    [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(this.currentLatLng);

    const nuevaEstructura = {
      archivo: this.informeService.selectedArchivoVuelo.archivo,
      coords: points,
      filas: this.filasPorDefecto,
      columnas: this.columnasPorDefecto,
      sentido: this.sentidoPorDefecto, // false: izq->drcha | true: drcha -> izq
      columnaInicio: 1,
      filaInicio: 1,
      vuelo: this.informeService.selectedArchivoVuelo.vuelo,
      latitud: this.currentLatLng.lat,
      longitud: this.currentLatLng.lng,
      globalCoords,
    } as EstructuraInterface;

    const nuevaEstructuraObj = new Estructura(nuevaEstructura);
    nuevaEstructuraObj.setModulo(modulo as ModuloInterface);

    // Dibujar dicha estructura
    // this.dibujarEstructura(nuevaEstructuraObj);

    // Añadir a la base de datos
    this.informeService
      .addEstructuraInforme(this.informeId, nuevaEstructura)
      .then(() => {
        this.successMessage = 'Estructura añadida - OK';
        setTimeout(() => {
          this.successMessage = undefined;
        }, 2000);
        this.alertMessage = undefined;
      })
      .catch((res) => {
        console.log('ERROR', res);
        this.alertMessage = 'ERROR';
      });
    // this.informeService.selectElementoPlanta(nuevaEstructuraObj);

    this.activeLine = null;
    this.activeShape = null;
    this.polygonMode = false;
    this.canvas.selection = true;
  }

  private setSquareBase(planta: PlantaInterface, squareBase: number) {
    if (planta.vertical) {
      // vertical
      this.squareWidth = this.squareBase;
      this.squareHeight = Math.round(this.squareWidth * this.squareProp);
    } else {
      // horizontal
      this.squareHeight = this.squareBase;
      this.squareWidth = Math.round(this.squareHeight * this.squareProp);
    }
  }

  private transformActObjToRaw(actObj) {
    let left: number;
    let top: number;
    let width: number;
    let height: number;

    // Los angulos de rotacion son positivos en sentido horario
    if (this.currentImageRotation === 270 || this.currentImageRotation === -90) {
      left = this.imageWidth - actObj.top - actObj.height;
      top = actObj.left;
      width = actObj.height;
      height = actObj.width;
    } else if (this.currentImageRotation === 180) {
      left = this.imageWidth - actObj.left - actObj.width;
      top = this.imageHeight - actObj.top - actObj.height;
      width = actObj.width;
      height = actObj.height;
    } else if (this.currentImageRotation === 90) {
      left = actObj.top;
      top = this.imageHeight - actObj.left - actObj.height;
      width = actObj.height;
      height = actObj.width;
    } else {
      left = actObj.left;
      top = actObj.top;
      width = actObj.width;
      height = actObj.height;
    }
    actObj.left = left;
    actObj.top = top;
    actObj.width = width;
    actObj.height = height;

    return actObj;
  }

  // onClickDeletePc(pc: PcInterface) {
  //   // Eliminamos el PC de la bbdd
  //   this.delPcFromDb(pc);

  //   // Eliminamos el cuadrado
  //   this.selected_pc = null;
  //   // Eliminamos el triangulo
  //   if (this.oldTriangle !== null && this.oldTriangle !== undefined) {
  //     this.canvas.remove(this.oldTriangle);
  //   }

  //   // Eliminamos el pc del canvas
  //   this.canvas.getObjects().forEach((object) => {
  //     if (object.local_id === pc.local_id) {
  //       this.canvas.remove(object);
  //     }
  //   });

  //   // Elimminamos el pc de la lista
  //   const index: number = this.allPcs.indexOf(pc);
  //   if (index !== -1) {
  //     this.allPcs.splice(index, 1);
  //   }
  // }

  // onObjectModified(event) {
  //   // const actObj = this.canvas.getActiveObject();
  //   const actObj = event.target;

  //   // Get HS img coords and draw triangle
  //   if (actObj !== null && actObj !== undefined) {
  //     if (actObj.get('type') === 'rect' && actObj.isMoving === true) {
  //       const actObjRaw = this.transformActObjToRaw(actObj);
  //       // const max_temp = this.getMaxTempInActObj(actObj);
  //       // this.selected_pc.temperaturaMax = max_temp.max_temp;
  //       // this.selected_pc.img_x = max_temp.max_temp_x;
  //       // this.selected_pc.img_y = max_temp.max_temp_y;
  //       if (actObjRaw.ref === true) {
  //         this.selected_pc.refTop = Math.round(actObjRaw.top);
  //         this.selected_pc.refLeft = Math.round(actObjRaw.left);
  //         this.selected_pc.refWidth = Math.round(Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x));
  //         this.selected_pc.refHeight = Math.round(Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y));
  //       } else {
  //         this.selected_pc.img_top = Math.round(actObjRaw.top);
  //         this.selected_pc.img_left = Math.round(actObjRaw.left);
  //         this.selected_pc.img_width = Math.round(Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x));
  //         this.selected_pc.img_height = Math.round(Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y));
  //       }
  //     }
  //   }
  // }
}
