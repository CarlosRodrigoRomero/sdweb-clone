import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable, Subscription, Subject, combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';

import 'fabric';

import { Point } from '@agm/core/services/google-maps-types';
import { LatLngLiteral } from '@agm/core/map-types';

import { HotkeysService, Hotkey } from 'angular2-hotkeys';

import inside from 'point-in-polygon';

declare let fabric;

import { PcInterface, Pc } from '@core/models/pc';
import { InformeService } from '@data/services/informe.service';
import { PlantaService } from '@data/services/planta.service';
import { PcService } from '@data/services/pc.service';

import { ElementoPlantaInterface } from '@core/models/elementoPlanta';
import { Estructura, RectanguloInterface } from '@core/models/estructura';
import { ModuloInterface } from '@core/models/modulo';
import { ArchivoVueloInterface } from '@core/models/archivoVuelo';
import { EstructuraInterface } from '@core/models/estructura';
import { PlantaInterface } from '@core/models/planta';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
})
export class CanvasComponent implements OnInit {
  @Input() pcsOrEstructuras: boolean;
  @Input() carpetaJpgGray: string;
  @Input() currentDatetime: number;
  @Input() currentCamera: string;
  @Input() currentCameraSN: number;
  @Input() currentTlinearGain: number;
  @Input() currentTrackheading: number;
  @Input() currentImageRotation: number;
  @Input() currentFrameNumber: number;
  @Input() currentFrameRate: number;

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
  estructuraList: Estructura[] = [];
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
  currentLatLng: LatLngLiteral;
  private elementSelectedOrigin: any;
  private estructuraSelectedIndex = 0;

  constructor(
    public informeService: InformeService,
    private route: ActivatedRoute,
    private plantaService: PlantaService,
    private pcService: PcService,
    private hotkeysService: HotkeysService
  ) {}

  ngOnInit(): void {
    this.imageWidth = GLOBAL.resolucionCamara[1];
    this.imageHeight = GLOBAL.resolucionCamara[0];
    this.selectedStrokeWidth = 2; // Tiene que ser par
    this.rectRefReduction = 0.2;
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.squareBase = 37;
    this.squareProp = 1.8;

    this.pcService
      .getPcsInformeEdit(this.informeId)
      .pipe(take(1))
      .subscribe((allPcs) => {
        this.allPcs = allPcs;
        if (this.allPcs.length > 0) {
          this.localIdCount = allPcs.sort(this.pcService.sortByLocalId)[allPcs.length - 1].local_id;
        } else {
          this.localIdCount = 0;
        }
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
        const elemPos = this.allPcs.findIndex((val) => {
          return val.id === elem.id;
        });

        if (elemPos >= 0) {
          // Si existe, le eliminamos
          this.allPcs.splice(elemPos, 1);
          this.deletePcCanvas(elem as Pc);
        } else {
          this.allPcs.push(elem as Pc);
        }
      } else if (elem.constructor.name === Estructura.name) {
        if (this.estructura === elem) {
          // Si ya existe, le eliminamo
          // Borrar estructura del Canvas
          this.limpiarEstructuraCanvas(this.estructura);
          this.borrarPcsEstructura(this.estructura);
          this.estructura = null;
        } else {
          if ((elem as Estructura).estructuraMatrix === null) {
            this.dibujarAutoEstructura(elem as Estructura);
          } else {
            this.dibujarEstructura(elem as Estructura);
          }
          this.informeService.selectElementoPlanta(elem);
        }
      }
    });

    this.informeService.droneLatLng$.subscribe((latLng) => {
      this.currentLatLng = latLng;
    });

    // creamos nuevas autoEstructuras pulsando la barra espaciadora
    this.hotkeysService.add(
      new Hotkey(
        'space',
        (event: KeyboardEvent): boolean => {
          // evitamos que se cree una autoEstructura donde ya hay una o una estructura normal
          combineLatest([
            this.informeService.getAllEstructuras(this.informeId),
            this.informeService.getAllAutoEstructuras(this.informeId),
          ])
            .pipe(take(1))
            .subscribe(([allEst, allAutoEst]) => {
              const allAmbasEstructuras = [...allEst, ...allAutoEst];

              if (
                !allAmbasEstructuras
                  .map((est) => est.archivo)
                  .includes(this.informeService.selectedArchivoVuelo.archivo)
              ) {
                this.addAutoEstructura();
              }
            });
          return false; // Prevent bubbling
        },
        undefined,
        '<---- retroceder 4 frames'
      )
    );
  }

  private borrarPcsEstructura(estructura: Estructura) {
    if (this.estructuraList.length === 1) {
      this.allPcs
        .filter((val) => {
          return val.archivo === estructura.archivo;
        })
        .forEach((pc) => {
          this.pcService.delPc(pc).then((v) => {
            this.informeService.avisadorNuevoElementoSource.next(pc);
            this.deletePcCanvas(pc);
          });
        });
    }
  }
  deletePcCanvas(pc: Pc) {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.hasOwnProperty('ref')) {
        if (obj.id === pc.id) {
          this.canvas.remove(obj);
        }
      }
    });
  }

  selectElementoPlanta(elementoPlanta: ElementoPlantaInterface): void {
    if (elementoPlanta === null) {
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
          this.selectEstructuraInCanvas(this.estructura);
        }
      } else if (elementoPlanta.constructor.name === Pc.name) {
        if (this.selectedPc !== elementoPlanta) {
          this.selectedPc = elementoPlanta as Pc;
          this.selectPcInCanvas(elementoPlanta as Pc);
        }
      }
    }
  }

  setEstructuraIndex(elementoPlanta: ElementoPlantaInterface): void {
    if (this.estructuraList.length > 0) {
      this.estructuraList.forEach((est, i) => {
        if (est.id === elementoPlanta.id) {
          this.estructuraSelectedIndex = i;
        }
      });
    }
  }

  selectEstructuraInCanvas(estructura: Estructura) {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.hasOwnProperty('estructura') && obj.estructura.id === estructura.id) {
        // this.canvas.remove(obj);
        obj.set('strokeWidth', 3);
        if (obj.hasOwnProperty('esquinaEstructura')) {
          obj.set('selectable', true);
          obj.set('radius', 5);
        }
      } else {
        obj.set('strokeWidth', 1);

        if (obj.hasOwnProperty('esquinaEstructura')) {
          obj.set('selectable', false);
          obj.set('radius', 0);
        }
      }
      this.canvas.renderAll();
    });
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

  getEstList(archivo: string) {
    combineLatest([
      this.informeService.getEstructuraInforme(this.informeId, archivo),
      this.informeService.getAutoEstructuraInforme(this.informeId, archivo),
    ])
      .pipe(take(1))
      .subscribe(([estList, autoEstList]) => {
        if (estList.length > 0) {
          this.estructuraList = estList;

          this.dibujarEstructuraList(this.estructuraList);
          if (this.informeService.selectedElementoPlanta === null) {
            this.informeService.selectElementoPlanta(this.estructuraList[this.estructuraSelectedIndex]);
          } else if (
            this.informeService.selectedElementoPlanta.id !== this.estructuraList[this.estructuraSelectedIndex].id
          ) {
            this.informeService.selectElementoPlanta(this.estructuraList[this.estructuraSelectedIndex]);
          }
        }
        if (autoEstList.length > 0) {
          this.estructuraList = autoEstList;

          this.dibujarEstructuraList(this.estructuraList);
          if (this.informeService.selectedElementoPlanta === null) {
            this.informeService.selectElementoPlanta(this.estructuraList[0]);
          } else if (this.informeService.selectedElementoPlanta.id !== this.estructuraList[0].id) {
            this.informeService.selectElementoPlanta(this.estructuraList[0]);
          }
        }
      });
  }

  dibujarEstructuraList(estList: Estructura[]) {
    estList.forEach((est) => {
      if (est.estructuraMatrix === null) {
        this.dibujarAutoEstructura(est);
      } else {
        this.dibujarEstructura(est);
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
            this.getEstList(archivoVuelo.archivo);
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
      if (obj.hasOwnProperty('puntoInteriorEst') && obj.estructura.id === estructura.id) {
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
          fill: '#72FD03',
          selectable: false,
          estructura,
          hoverCursor: 'default',
          puntoInteriorEst: true,
        });
        this.canvas.add(circle);
        this.canvas.sendToBack(circle);
      });
    });
  }

  updateEstructura(filasColumnas = false) {
    if (filasColumnas) {
      this.filasPorDefecto = this.estructura.filas;
      this.columnasPorDefecto = this.estructura.columnas;
      this.sentidoPorDefecto = this.estructura.sentido;
    }

    // Borramos del canvas la estructura anterior.
    this.limpiarEstructuraCanvas(this.estructura);

    this.dibujarEstructura(this.estructura);
    this.informeService.avisadorChangeElementoSource.next(this.estructura);
    this.informeService
      .updateElementoPlanta(this.informeId, this.estructura)
      .then((res) => {
        this.successMessage = 'Estructura actualizada - OK';
        setTimeout(() => {
          this.successMessage = undefined;
        }, 2000);
        this.alertMessage = undefined;
        this.getEstList(this.estructura.archivo);
      })
      .catch((err) => {
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
      estructura,
      hoverCursor: 'pointer',
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
        estructura,
        esquinaEstructura: true,
        selectable: true,
        hoverCursor: 'pointer',
      });
      this.canvas.add(circle);
    });
    this.canvas.renderAll();

    // Dibujar puntos interiores
    this.dibujarPuntosInterioresEst(estructura);

    // Event Listener: Cuando se modifique el objeto...
    this.canvas.on('object:modified', (options) => {
      const p = options.target;
      if (p.hasOwnProperty('estructura')) {
        if (p.estructura.id === estructura.id) {
          polygon.points[p.name] = { x: p.getCenterPoint().x, y: p.getCenterPoint().y };
          estructura.coords = polygon.points;
          this.informeService.avisadorChangeElementoSource.next(estructura);
          this.informeService.updateElementoPlanta(this.informeId, estructura);

          this.dibujarPuntosInterioresEst(estructura);
        }
      }
    });
  }

  dibujarAutoEstructura(estructura: Estructura) {
    if (estructura.estructuraCoords !== null) {
      estructura.estructuraCoords.forEach((fila) => {
        fila.forEach((modulo, index) => {
          const puntos = [
            { x: modulo[0][0], y: modulo[0][1] },
            { x: modulo[1][0], y: modulo[1][1] },
            { x: modulo[2][0], y: modulo[2][1] },
            { x: modulo[3][0], y: modulo[3][1] },
          ];

          const polygon = new fabric.Polygon(puntos, {
            left: modulo[0][0],
            top: modulo[2][1],
            fill: 'rgba(0,0,0,0)',
            stroke: '#2874A6',
            strokeWidth: 0.5,
            // strokeDashArray: [5, 5],
            selectable: false,
            estructura,
            hoverCursor: 'pointer',
            originX: 'left',
            originY: 'bottom',
            name: 1,
          });
          this.canvas.add(polygon);
          // lo movemos en el eje Z para que no quede delante de las anomalias antiguas
          this.canvas.moveTo(polygon, 0);
        });
      });
    }

    this.canvas.renderAll();
  }

  private drawPcInCanvas(pc: PcInterface) {
    if (pc.hasOwnProperty('coords')) {
      // primero comprovamos las PC tipo poligono
      this.drawPolygonsInCanvas(pc);
    } else {
      // luego las tipo rectangulo
      this.drawRectsInCanvas(pc);
    }
  }

  private drawRectsInCanvas(pc: PcInterface) {
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
    const strokeWidth = 2;

    const rect = new fabric.Rect({
      left: transformedRect.left,
      top: transformedRect.top,
      fill: 'rgba(0,0,0,0)',
      stroke: this.getColorByTipo(pc.tipo),
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

  private getColorByTipo(tipo: number): string {
    return COLOR.colores_tipos[tipo];
  }

  private drawPolygonsInCanvas(pc: PcInterface) {
    const polygon = new fabric.Polygon(pc.coords, {
      fill: 'rgba(0,0,0,0)',
      stroke: this.getColorByTipo(pc.tipo),
      strokeWidth: 2,
      selectable: true,
      objectCaching: false,
      hoverCursor: 'pointer',
      id: pc.id,
      ref: false,
      hasRotatingPoint: false,
      hasControls: false,
      type: 'polygon',
    });

    const polygonRef = new fabric.Polygon(pc.coordsRef, {
      fill: 'rgba(0,0,0,0)',
      stroke: 'blue',
      strokeWidth: 2,
      selectable: true,
      objectCaching: false,
      hoverCursor: 'pointer',
      id: pc.id,
      ref: true,
      hasRotatingPoint: false,
      hasControls: false,
      type: 'polygon',
    });

    this.canvas.add(polygon);
    this.canvas.add(polygonRef);

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
    // Seleccionar estructura
    this.canvas.on('mouse:down', (options) => {
      if (!this.pcsOrEstructuras) {
        if (options.button === 1 && options.hasOwnProperty('target') && options.target !== null) {
          if (options.target.hasOwnProperty('estructura')) {
            this.selectElementoPlanta(options.target.estructura);
            this.setEstructuraIndex(options.target.estructura);
          }
        }
      }
    });

    // Seleccionar pcs
    this.canvas.on('mouse:down', (options) => {
      if (options.hasOwnProperty('target') && options.target !== null) {
        if (options.target.hasOwnProperty('ref')) {
          // seleccionamos el origen del movimiento
          this.elementSelectedOrigin = options.target.aCoords.tl;
        }
      }
    });

    // Creacion de Estructura con boton derecho
    this.canvas.on('mouse:down', (options) => {
      if ((options.button === 3 || (options.button === 1 && options.e.ctrlKey)) && !this.polygonMode) {
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
      }
    });
    ///////////////////////////////////////////////////

    // Seleccionar al hacer click
    this.canvas.on('mouse:up', (options) => {});

    // al mover o modificar
    this.canvas.on('object:modified', (options) => {
      // En el caso de que sea una anomalia
      if (options.target !== null && options.target.hasOwnProperty('ref')) {
        const actObjRaw = options.target;

        if (actObjRaw.ref === true) {
          if (actObjRaw.hasOwnProperty('type') && actObjRaw.type === 'polygon') {
            // asignamos las nuevas coordenadas
            const newOrigin = actObjRaw.aCoords.tl;
            const coordsRef = this.getNewCoords(this.selectedPc.coordsRef, newOrigin);
            this.selectedPc.coordsRef = coordsRef;
          } else {
            // antiguos rectangulos
            this.selectedPc.refTop = Math.round(actObjRaw.top);

            this.selectedPc.refLeft = Math.round(actObjRaw.left);
            this.selectedPc.refWidth = Math.round(
              Math.abs(actObjRaw.aCoords.tr.x - actObjRaw.aCoords.tl.x) - actObjRaw.strokeWidth / 2
            );
            this.selectedPc.refHeight = Math.round(
              Math.abs(actObjRaw.aCoords.bl.y - actObjRaw.aCoords.tl.y) - actObjRaw.strokeWidth / 2
            );
          }
        } else {
          if (actObjRaw.hasOwnProperty('type') && actObjRaw.type === 'polygon') {
            // asignamos las nuevas coordenadas
            const newOrigin = actObjRaw.aCoords.tl;
            const coords = this.getNewCoords(this.selectedPc.coords, newOrigin);
            this.selectedPc.coords = coords;
          } else {
            // antiguos rectangulos
            this.selectedPc.img_top = Math.round(actObjRaw.top);
            this.selectedPc.img_left = Math.round(actObjRaw.left);
            this.selectedPc.img_width = Math.round(
              Math.abs(actObjRaw.aCoords.tr.x - actObjRaw.aCoords.tl.x) - actObjRaw.strokeWidth / 2
            );
            this.selectedPc.img_height = Math.round(
              Math.abs(actObjRaw.aCoords.bl.y - actObjRaw.aCoords.tl.y) - actObjRaw.strokeWidth / 2
            );
          }
        }
        this.pcService.updatePc(this.selectedPc);
      }
    });
  }

  private PointToCoords(puntos: Point[]) {
    return puntos.map((p) => {
      return [p.x, p.y];
    });
  }

  private pointsToDB(puntos: Point[]) {
    return puntos.map((p) => {
      return { x: p.x, y: p.y };
    });
  }

  private getNewCoords(coords: any[], newOrigin: any): any[] {
    const difX = newOrigin.x - this.elementSelectedOrigin.x;
    const difY = newOrigin.y - this.elementSelectedOrigin.y;
    const newCoords = coords.map((p) => {
      return { x: p.x + difX, y: p.y + difY };
    });
    return newCoords;
  }

  private getEstructuraPunto(punto: Point) {
    let estEncontrada = null;
    if (this.estructuraList !== null) {
      this.estructuraList.forEach((est) => {
        // primero las autoestructuras
        if (est.estructuraMatrix === null) {
          est.estructuraCoords.forEach((fila) => {
            fila.forEach((modulo) => {
              // const moduloCorrecto = [modulo[2], modulo[3], modulo[1], modulo[0]];
              if (inside([punto.x, punto.y], modulo)) {
                estEncontrada = est;
              }
            });
          });
        } else {
          const coords = this.PointToCoords(est.coords);
          if (inside([punto.x, punto.y], coords)) {
            estEncontrada = est;
          }
        }
      });
    }

    return estEncontrada;
  }

  private addAutoEstructura() {
    let globalCoords;
    let modulo;
    [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(this.currentLatLng);

    const autoEstructura = {
      archivo: this.informeService.selectedArchivoVuelo.archivo,
      vuelo: this.informeService.selectedArchivoVuelo.vuelo,
      latitud: this.estructura && this.planta.tipo === 'seguidores' ? this.estructura.latitud : this.currentLatLng.lat,
      longitud:
        this.estructura && this.planta.tipo === 'seguidores' ? this.estructura.longitud : this.currentLatLng.lng,
      globalCoords,
      estructuraCoords: null,
    } as EstructuraInterface;

    this.informeService
      .addAutoEstructuraInforme(this.informeId, autoEstructura)
      .then(() => {
        this.successMessage = 'AutoEstructura añadida - OK';
        setTimeout(() => {
          this.successMessage = undefined;
        }, 2000);
        this.alertMessage = undefined;
      })
      .catch((res) => {
        console.log('ERROR', res);
        this.alertMessage = 'ERROR';
      });
  }

  onDblClickCanvas(event: MouseEvent) {
    // Deseleccionar elemento anterior para evitar sobrescribir
    this.informeService.uncheckPc();

    let fila: number;
    let columna: number;
    let columnaReal: number;
    let filaReal: number;
    // let rectInteriorPc: RectanguloInterface;
    let polygonPc: number[][];

    // Referencia
    let polygonRef: number[][];
    // let rectInteriorRef: RectanguloInterface;
    let filaRef: number;
    let columnaRef: number;

    const point = { x: event.offsetX, y: event.offsetY } as Point;
    const estructura = this.getEstructuraPunto(point);
    if (estructura !== null) {
      if (estructura.estructuraMatrix === null) {
        // autoestructuras
        [fila, columna] = estructura.getFilaColumnaAutoEst(event.offsetX, event.offsetY);

        // console.log(fila, columna);
        // console.log(estructura.getNumFilColAutoEst(fila, columna));

        [filaReal, columnaReal] = [fila, columna];
        [columnaRef, filaRef] = estructura.getFilaColumnaRef(columna, fila);

        polygonPc = estructura.getPolygonPc(columna, fila);
        polygonRef = estructura.getPolygonPc(columnaRef, filaRef);
      } else {
        // estructuras
        [fila, columna] = estructura.calcularFilaColumna(event.offsetX, event.offsetY);

        [columnaReal, filaReal] = estructura.getLocalCoordsFromEstructura(columna, fila);
        [columnaRef, filaRef] = estructura.getFilaColumnaRef(columna, fila);

        polygonPc = estructura.getPolygonPc(columna, fila);
        polygonRef = estructura.getPolygonPc(columnaRef, filaRef);

        // tamaño por defecto cuando no hay estructura
        // this.setSquareBase(
        //   this.planta,
        //   Math.min(rectInteriorPc.bottom - rectInteriorPc.top, rectInteriorPc.right - rectInteriorPc.left)
        // );
      }

      // Localizaciones
      let globalCoords;
      let modulo;
      [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(this.estructura.getLatLng());

      // Creamos el nuevo PC
      let newPc: PcInterface = {
        id: '',
        archivo: this.informeService.selectedArchivoVuelo.archivo,
        vuelo: this.informeService.selectedArchivoVuelo.vuelo,
        tipo: GLOBAL.anomaliaPorDefecto, // tipo (diodo bypass por defecto)
        local_x: columnaReal, // local_x
        local_y: filaReal, // local_x
        globalCoords, //
        gps_lng: estructura.getLatLng().lng,
        gps_lat: estructura.getLatLng().lat,
        coords: polygonPc,
        coordsRef: polygonRef,
        img_x: 0, // coordenadas raw del punto mas caliente
        img_y: 0, // coordenadas raw del punto mas caliente
        // local_id: this.localIdCount,
        image_rotation: this.currentImageRotation,
        informeId: this.informeId,
        datetime: this.currentDatetime,
        resuelto: false,
        modulo,
      };

      let localId;
      if (typeof this.localIdCount === 'number') {
        this.localIdCount += 1;
        localId = this.localIdCount;
      } else {
        localId = this.pcService.getLocalId(newPc);
      }

      newPc.local_id = localId;

      newPc = this.addNewPcProperties(newPc);

      const pcInCanvas = this.checkIfPcInCanvas();
      if (pcInCanvas) {
        const selectedPc = pcInCanvas as Pc;
        if (pcInCanvas.hasOwnProperty('coords')) {
          // PCs tipo poligono
          newPc.coordsRef = selectedPc.coordsRef;
        } else {
          // PCs tipo rectangulo
          newPc.refHeight = selectedPc.refHeight;
          newPc.refWidth = selectedPc.refWidth;
          newPc.refTop = selectedPc.refTop;
          newPc.refLeft = selectedPc.refLeft;

          // borramos la nueva ref para seguir usando la angigua
          delete newPc.coordsRef;
        }

        if (!this.estructura) {
          if (selectedPc.archivo === newPc.archivo && this.planta.tipo === 'seguidores') {
            newPc.globalCoords = selectedPc.globalCoords;
            newPc.gps_lng = selectedPc.gps_lng;
            newPc.gps_lat = selectedPc.gps_lat;
          }
          // if (selectedPc.archivo === newPc.archivo && this.estructura.columnas === 1) {
          //   newPc.local_x = selectedPc.local_x;
          // }
        }
      }

      this.pcService.addPc(newPc).then((pcRef) => {
        this.drawPcInCanvas(newPc);
        const pc = new Pc(newPc);
        this.informeService.avisadorNuevoElementoSource.next(pc);
        this.informeService.selectElementoPlanta(pc);
      });
    }
  }

  private addNewPcProperties(pc: PcInterface) {
    if (this.currentCamera !== undefined) {
      pc.camaraNombre = this.currentCamera;
    }
    if (this.currentCameraSN !== undefined && this.currentCameraSN !== null && !isNaN(this.currentCameraSN)) {
      pc.camaraSN = this.currentCameraSN;
    }
    if (this.currentTlinearGain !== undefined && this.currentTlinearGain !== null && !isNaN(this.currentTlinearGain)) {
      pc.TlinearGain = this.currentTlinearGain;
    }
    if (this.currentFrameNumber !== undefined && this.currentFrameNumber !== null && !isNaN(this.currentFrameNumber)) {
      pc.FrameNumber = this.currentFrameNumber;
    }
    if (this.currentFrameRate !== undefined && this.currentFrameRate !== null && !isNaN(this.currentFrameRate)) {
      pc.FrameRate = this.currentFrameRate;
    }

    return pc;
  }

  checkIfPcInCanvas() {
    const pcsInCanvas = this.allPcs.filter((pc) => {
      return pc.archivo === this.informeService.selectedArchivoVuelo.archivo;
    });
    if (pcsInCanvas.length > 0) {
      return pcsInCanvas[0];
    }
    return false;
  }

  deleteEstructura(estructura: Estructura) {
    if (estructura.estructuraMatrix === null) {
      this.informeService.deleteAutoEstructuraInforme(this.informeId, estructura);
    } else {
      this.informeService.deleteEstructuraInforme(this.informeId, estructura);
    }
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

  private limpiarEstructuraCanvas(estructura: EstructuraInterface) {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.hasOwnProperty('estructura') && obj.estructura.id === estructura.id) {
        this.canvas.remove(obj);
      }
    });
  }

  onClickCrearEstructura() {
    if (!this.polygonMode) {
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
      latitud: this.estructura && this.planta.tipo === 'seguidores' ? this.estructura.latitud : this.currentLatLng.lat,
      longitud:
        this.estructura && this.planta.tipo === 'seguidores' ? this.estructura.longitud : this.currentLatLng.lng,
      globalCoords,
    } as EstructuraInterface;

    const nuevaEstructuraObj = new Estructura(nuevaEstructura);
    nuevaEstructuraObj.setModulo(modulo as ModuloInterface);

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
}
