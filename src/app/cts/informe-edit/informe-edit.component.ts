import { Component, OnInit, ViewChild } from "@angular/core";
import { InformeService } from "src/app/services/informe.service";
import { PcService } from "src/app/services/pc.service";
import { PlantaService } from "src/app/services/planta.service";
import { InformeInterface } from "src/app/models/informe";
import { PlantaInterface } from "src/app/models/planta";
import { PcInterface } from "src/app/models/pc";
import { ActivatedRoute, Router } from "@angular/router";
import { GLOBAL } from "../../services/global";

import "fabric";
import { take, map } from "rxjs/operators";
import { Estructura } from "../../models/estructura";
import { AgmMap } from "@agm/core";
import { ModuloInterface } from "../../models/modulo";
import { Point } from "@agm/core/services/google-maps-types";
declare let fabric;
declare const google: any;

export interface Punto {
  x: number;
  y: number;
}
export interface Rectangulo {
  tl: Punto;
  tr: Punto;
  bl: Punto;
  br: Punto;
}

@Component({
  selector: "app-informe-edit",
  templateUrl: "./informe-edit.component.html",
  styleUrls: ["./informe-edit.component.css"],
  providers: [InformeService, PlantaService, PcService]
})
export class InformeEditComponent implements OnInit {
  @ViewChild(AgmMap) map: any;

  public titulo: number;
  public informe: InformeInterface;
  public planta: PlantaInterface;
  public allPcs: PcInterface[];
  public url: string;
  public alertMessage: string;
  public DEFAULT_LAT: number;
  public DEFAULT_LNG: number;
  public mapType: string;
  public defaultZoom: number;
  public fileList: string[];
  public canvas;
  public fabImg;
  public fabImg2;
  public squareBase;
  public squareProp;
  public squareHeight;
  public squareWidth;
  public tooltip_temp;
  public pc_img_coords;
  public pc_temp;
  public localIdCount: number;
  public oldTriangle;
  public oldTriangle2;
  public coords;
  public event: MouseEvent;
  public currentFileName: string;
  public current_gps_lat: number;
  public current_gps_lng: number;
  public current_track_heading: number;
  public current_image_rotation: number;
  public map_current_marker;
  public current_gps_correction: number;
  public rangeValue: number;
  public selected_pc: PcInterface;
  public flights_data: Object;
  public flights_list: string[];
  public flights_names: string[];
  public flights_numbers: number[];
  public currentFlight: string;
  public columnasEstructura: number;
  public filasEstructura: number;
  public columnas_array: number[];
  public filas_array: number[];
  public max_temp: number;
  public min_temp: number;
  public image_width: number;
  public image_height: number;
  public current_datetime: number;
  public manualRotation: boolean;
  private gmt_hours_diff: number;
  public lastRef: number[];
  public currentGlobalX: number;
  public currentGlobalY: string;
  public estructura: Estructura;
  public buildingEstructura = false;
  public estructuraMatrix: any;
  public estructuraOn: boolean;
  public polygonList: any[];
  private _selectedStrokeWidth: number;
  private rectRefReduction: number;
  public sentidoEstructura: boolean;
  public columnaInicioEstructura: number = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private pcService: PcService
  ) {
    this.mapType = "satellite";
    this.defaultZoom = 18;

    this.localIdCount = 0;
    this.rangeValue = 0;
    this.fileList = new Array();
    this.coords = new Array();
    this.rectRefReduction = 0.1;

    // this.max_temp = 70;
    // this.min_temp = 41;

    this.url = GLOBAL.url;
    this.current_gps_correction = 0;
    this.currentFlight = "1";
    this.current_gps_lng = -5.880743;
    this.current_gps_lat = 39.453186;
    this.current_track_heading = 0;
    this.current_image_rotation = 0;
    this.squareBase = 37;
    this.squareProp = 2.3;
    this._selectedStrokeWidth = 3;

    this.image_width = 640;
    this.image_height = 512;

    this.gmt_hours_diff = 2;
    this.manualRotation = false;

    this.allPcs = new Array<PcInterface>();
    this.estructura = this.crearNuevaEstructura("");
    this.polygonList = [];

    this.sentidoEstructura = false;
  }

  ngOnInit() {
    this.getInforme();
    this.canvas = new fabric.Canvas("mainCanvas");

    this.canvas.on("mouse:up", options => {
      if (options.target !== null) {
        if (options.target.hasOwnProperty("local_id")) {
          const selectedPc = this.allPcs.find(
            item => item.local_id === options.target.local_id
          );
          this.canvas.setActiveObject(options.target);
          this.onMapMarkerClick(selectedPc);
        }
      }
    });

    this.canvas.on("object:modified", options => {
      if (options.target.type === "rect") {
        const actObjRaw = this.transformActObjToRaw(options.target);
        this.selectPcFromLocalId(options.target.local_id);

        if (actObjRaw.ref === true) {
          this.selected_pc.refTop = Math.round(actObjRaw.top);

          this.selected_pc.refLeft = Math.round(actObjRaw.left);
          this.selected_pc.refWidth = Math.round(
            Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x)
          );
          this.selected_pc.refHeight = Math.round(
            Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y)
          );
        } else {
          this.selected_pc.img_top = Math.round(actObjRaw.top);
          this.selected_pc.img_left = Math.round(actObjRaw.left);
          this.selected_pc.img_width = Math.round(
            Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x)
          );
          this.selected_pc.img_height = Math.round(
            Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y)
          );
        }
      }

      this.updatePcInDb(this.selected_pc);
    });

    // this.canvas.on('object:modified', this.onObjectModified);
  }

  onObjectModified(event) {
    // const actObj = this.canvas.getActiveObject();
    const actObj = event.target;

    // Get HS img coords and draw triangle
    if (actObj !== null && actObj !== undefined) {
      if (actObj.get("type") === "rect" && actObj.isMoving === true) {
        const actObjRaw = this.transformActObjToRaw(actObj);
        // const max_temp = this.getMaxTempInActObj(actObj);
        // this.selected_pc.temperaturaMax = max_temp.max_temp;
        // this.selected_pc.img_x = max_temp.max_temp_x;
        // this.selected_pc.img_y = max_temp.max_temp_y;
        if (actObjRaw.ref === true) {
          this.selected_pc.refTop = Math.round(actObjRaw.top);
          this.selected_pc.refLeft = Math.round(actObjRaw.left);
          this.selected_pc.refWidth = Math.round(
            Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x)
          );
          this.selected_pc.refHeight = Math.round(
            Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y)
          );
        } else {
          this.selected_pc.img_top = Math.round(actObjRaw.top);
          this.selected_pc.img_left = Math.round(actObjRaw.left);
          this.selected_pc.img_width = Math.round(
            Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x)
          );
          this.selected_pc.img_height = Math.round(
            Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y)
          );
        }
      }
    }
  }

  getCurrentImageRotation(trackHeading: number) {
    // track_heading: en grados
    // return: angulo de rotacion, sentido horario positivo
    if (this.manualRotation) {
      return this.current_image_rotation;
    }

    if (trackHeading >= 45 && trackHeading < 135) {
      return 90;
    } else if (trackHeading >= 135 && trackHeading < 225) {
      return 180;
    } else if (trackHeading >= 225 && trackHeading < 315) {
      return 270; // -90 º || 270 º
    } else {
      return 0;
    }
  }

  transformCoordsToRotated(x: number, y: number) {
    // current image rotation en grados
    let x_: number;
    let y_: number;

    if (this.current_image_rotation === 90) {
      x_ = this.image_height - y;
      y_ = x;
    } else if (this.current_image_rotation === 180) {
      x_ = this.image_width - x;
      y_ = this.image_height - y;
    } else if (
      this.current_image_rotation === 270 ||
      this.current_image_rotation === -90
    ) {
      x_ = y;
      y_ = this.image_width - x;
    } else {
      x_ = x;
      y_ = y;
    }

    return { x: x_, y: y_ };
  }

  transformCoordsToRaw(x_: number, y_: number) {
    // current image rotation en grados
    // let x = Math.round(x_ * Math.cos(Math.PI / 180 * this.current_image_rotation)
    //         + y_ * Math.sin(Math.PI / 180 * this.current_image_rotation));
    // let y = Math.round(- x_ * Math.sin(Math.PI / 180 * this.current_image_rotation)
    //         + y_ * Math.cos(Math.PI / 180 * this.current_image_rotation));
    let x: number;
    let y: number;

    // Los angulos de rotacion son positivos en sentido horario
    if (
      this.current_image_rotation === 270 ||
      this.current_image_rotation === -90
    ) {
      x = this.image_width - y_;
      y = x_;
    } else if (this.current_image_rotation === 180) {
      x = this.image_width - x_;
      y = this.image_height - y_;
    } else if (this.current_image_rotation === 90) {
      x = y_;
      y = this.image_height - x_;
    } else {
      x = x_;
      y = y_;
    }
    return { x, y };
  }

  transformActObjToRaw(act_obj) {
    let left: number;
    let top: number;
    let width: number;
    let height: number;

    // Los angulos de rotacion son positivos en sentido horario
    if (
      this.current_image_rotation === 270 ||
      this.current_image_rotation === -90
    ) {
      left = this.image_width - act_obj.top - act_obj.height;
      top = act_obj.left;
      width = act_obj.height;
      height = act_obj.width;
    } else if (this.current_image_rotation === 180) {
      left = this.image_width - act_obj.left - act_obj.width;
      top = this.image_height - act_obj.top - act_obj.height;
      width = act_obj.width;
      height = act_obj.height;
    } else if (this.current_image_rotation === 90) {
      left = act_obj.top;
      top = this.image_height - act_obj.left - act_obj.height;
      width = act_obj.height;
      height = act_obj.width;
    } else {
      left = act_obj.left;
      top = act_obj.top;
      width = act_obj.width;
      height = act_obj.height;
    }
    act_obj.left = left;
    act_obj.top = top;
    act_obj.width = width;
    act_obj.height = height;

    return act_obj;
  }

  transformActObjToRotated(act_obj) {
    let left: number;
    let top: number;
    let width: number;
    let height: number;

    // Los angulos de rotacion son positivos en sentido horario
    if (
      this.current_image_rotation === 270 ||
      this.current_image_rotation === -90
    ) {
      top = this.image_width - act_obj.left - act_obj.width;
      left = act_obj.top;
      width = act_obj.height;
      height = act_obj.width;
    } else if (this.current_image_rotation === 180) {
      left = this.image_width - act_obj.left - act_obj.width;
      top = this.image_height - act_obj.top - act_obj.height;
      width = act_obj.width;
      height = act_obj.height;
    } else if (this.current_image_rotation === 90) {
      top = act_obj.left;
      left = this.image_height - act_obj.top - act_obj.width;
      width = act_obj.height;
      height = act_obj.width;
    } else {
      left = act_obj.left;
      top = act_obj.top;
      width = act_obj.width;
      height = act_obj.height;
    }

    return { left, top, width, height };
  }
  onMouseMoveCanvas(event: MouseEvent) {}

  private drawTriangle(x: number, y: number) {
    if (this.oldTriangle !== null && this.oldTriangle !== undefined) {
      this.canvas.remove(this.oldTriangle);
    }
    const triangle = new fabric.Triangle({
      width: this.squareBase,
      height: this.squareBase,
      fill: "red",
      left: Math.round(x - this.squareBase / 2),
      top: y + 2, // si no ponemos este 2, entonces no lee bien debajo del triangulo
      selectable: false
    });
    this.oldTriangle = triangle;
    this.canvas.add(triangle);
    this.canvas.renderAll();
  }

  getLeftAndTop() {
    if (this.current_image_rotation === 90) {
      return {
        left: this.image_height,
        top: 0,
        height: this.image_width,
        width: this.image_height
      };
    } else if (this.current_image_rotation === 180) {
      return {
        left: this.image_width,
        top: this.image_height,
        height: this.image_height,
        width: this.image_width
      };
    } else if (this.current_image_rotation === 270) {
      return {
        left: 0,
        top: this.image_width,
        height: this.image_width,
        width: this.image_height
      };
    } else {
      return {
        left: 0,
        top: 0,
        height: this.image_height,
        width: this.image_width
      };
    }
  }

  addFabricImage(imgSrc) {
    const leftAndTop = this.getLeftAndTop();

    const objectsCanvas = this.canvas.getObjects();
    for (let i = 0; i <= objectsCanvas.length; i++) {
      this.canvas.remove(objectsCanvas[i]);
    }

    fabric.Image.fromURL(imgSrc, image => {
      // add background image
      if (this.fabImg) {
        this.canvas.remove(this.fabImg);
      }
      this.canvas.setBackgroundImage(
        image,
        this.canvas.renderAll.bind(this.canvas),
        {
          // scaleX: this.canvas.width / image.width,
          // scaleY: this.canvas.height / image.height,
          crossOrigin: "anonymous",
          angle: this.current_image_rotation,
          left: leftAndTop.left,
          top: leftAndTop.top,
          selectable: false
          // originX: 'top',
          // originY: 'left'
        }
      );
      this.fabImg = image;
    });
  }

  getLocalCoordsFromEstructura(columna, fila, estructura) {
    let columnaReal = columna;
    let filaReal = fila;

    if (estructura.hasOwnProperty("sentido")) {
      columnaReal = estructura.sentido
        ? estructura.columnas - columna + 1
        : columna;
    }
    if (this.estructura.hasOwnProperty("columnaInicio")) {
      columnaReal = columnaReal + estructura.columnaInicio - 1;
    }

    return [columnaReal, filaReal];
  }

  onDblClickCanvas(event) {
    let fila: number;
    let columna: number;
    let height: number;
    let width: number;
    let top: number;
    let left: number;
    // Referencia
    let topLeftRef: Point;
    let topRightRef: Point;
    let bottomLeftRef: Point;
    let bottomRightRef: Point;
    let topRef: number;
    let leftRef: number;
    let heightRef: number;
    let widthRef: number;
    let columnaReal: number;
    let filaReal: number;

    if (this.estructuraOn) {
      [fila, columna] = this.calcularFilaColumna(event.offsetX, event.offsetY);
      [columnaReal, filaReal] = this.getLocalCoordsFromEstructura(
        columna,
        fila,
        this.estructura
      );

      const topLeftModulo = this.estructuraMatrix[fila - 1][columna - 1];
      const topRightModulo = this.estructuraMatrix[fila - 1][columna];
      const bottomRightModulo = this.estructuraMatrix[fila][columna];
      const bottomLeftModulo = this.estructuraMatrix[fila][columna - 1];
      if (columna == this.estructura.columnas) {
        topLeftRef = this.estructuraMatrix[fila - 1][columna - 2];
        bottomLeftRef = this.estructuraMatrix[fila][columna - 2];
        topRightRef = topLeftModulo;
        bottomRightRef = bottomLeftModulo;
      } else {
        topLeftRef = topRightModulo;
        bottomLeftRef = bottomRightModulo;
        topRightRef = this.estructuraMatrix[fila - 1][columna + 1];
        bottomRightRef = this.estructuraMatrix[fila][columna + 1];
      }

      top = 0.5 * (topLeftModulo.y + topRightModulo.y);
      left = 0.5 * (topLeftModulo.x + bottomLeftModulo.x);
      height =
        0.5 *
        (-topLeftModulo.y +
          bottomLeftModulo.y -
          topRightModulo.y +
          bottomRightModulo.y);

      width =
        0.5 *
        (topRightModulo.x -
          topLeftModulo.x +
          bottomRightModulo.x -
          bottomLeftModulo.x);

      //   Ref
      topRef = Math.max(topLeftRef.y, topRightRef.y);
      leftRef = Math.max(topLeftRef.x, bottomLeftRef.x);
      heightRef = Math.min(bottomLeftRef.y, bottomRightRef.y) - topRef;
      widthRef = Math.min(topRightRef.x, bottomRightRef.x) - leftRef;

      leftRef = Math.round(leftRef + widthRef * this.rectRefReduction);
      topRef = Math.round(topRef + heightRef * this.rectRefReduction);
      widthRef = Math.round(widthRef * (1 - this.rectRefReduction));
      heightRef = Math.round(heightRef * (1 - this.rectRefReduction));
    } else {
      filaReal = 0;
      columnaReal = 1;

      top = event.offsetY - this.squareHeight / 2;
      left = event.offsetX - this.squareWidth / 2;
      height = this.squareHeight;
      width = this.squareWidth;

      leftRef = left + width;
      topRef = top;
      widthRef = width;
      heightRef = height;
    }

    // Localizaciones
    let globalX;
    let globalY;
    let modulo_;

    [globalX, globalY, modulo_] = this.getGlobalCoordsFromLocationArea({
      lat: this.current_gps_lat,
      lng: this.current_gps_lng
    });

    // Creamos el nuevo PC
    this.localIdCount += 1;

    const newPc: PcInterface = {
      id: "",
      archivo: this.currentFileName,
      tipo: 8, // tipo (celula caliente por defecto)
      local_x: columnaReal, // local_x
      local_y: filaReal, // local_x
      global_x: globalX, // global_x
      global_y: globalY, // global_y
      gps_lng: this.current_gps_lng,
      gps_lat: this.current_gps_lat,
      img_left: left,
      img_top: top,
      img_width: width,
      img_height: height,
      img_x: 0, // coordenadas raw del punto mas caliente
      img_y: 0, // coordenadas raw del punto mas caliente
      local_id: this.localIdCount,
      vuelo: this.currentFlight,
      image_rotation: this.current_image_rotation,
      informeId: this.informe.id,
      datetime: this.current_datetime,
      resuelto: false,
      color: "black",
      refTop: topRef,
      refLeft: leftRef,
      refHeight: heightRef,
      refWidth: widthRef,
      modulo: modulo_
    };

    //

    if (this.selected_pc) {
      this.selected_pc.color = "black";
      if (
        this.selected_pc.archivo === newPc.archivo &&
        this.planta.tipo === "2 ejes"
      ) {
        newPc.global_x = this.selected_pc.global_x;
        newPc.global_y = this.selected_pc.global_y;
        newPc.gps_lng = this.selected_pc.gps_lng;
        newPc.gps_lat = this.selected_pc.gps_lat;
      }
    }

    this.addPcToDb(newPc);
    this.drawPcInCanvas(newPc);
    this.onMapMarkerClick(newPc);
  }

  onMouseUpCanvas(event) {
    const actObj = this.canvas.getActiveObject();

    if (actObj !== null && actObj !== undefined) {
      if (actObj.get("type") === "rect") {
        // const actObjRaw = this.transformActObjToRaw(actObj);
        this.selectPcFromLocalId(actObj.local_id);
        // actObj.set("stroke", "green");
      }
    }
  }

  selectPcFromLocalId(localId: number) {
    this.selected_pc = this.allPcs.find(item => item.local_id === localId);

    // transformar coordenadas a rotated
    // const rotatedPcCoords = this.transformCoordsToRotated(this.selected_pc.img_x, this.selected_pc.img_y);
    // this.drawTriangle(rotatedPcCoords.x, rotatedPcCoords.y);
    // this.drawTriangle2(this.selected_pc.img_x, this.selected_pc.img_y); // TO REMOVE
  }

  // rgb2temp(red, green, blue) {
  //   // a = (max_temp - min_temp) / 255
  //   // b= min_temp
  //   // const max_temp = this.max_temp;
  //   // const min_temp = this.min_temp;

  //   const b = min_temp;
  //   const a = (max_temp - min_temp) / 255;

  //   const x = (red + green + blue) / 3;
  //   return Math.round((x * a + b) * 10) / 10;
  // }

  indexOfMax(arr) {
    if (arr.length === 0) {
      return -1;
    }

    let maxValue = arr[0];
    let maxIndex = 0;

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > maxValue) {
        maxIndex = i;
        maxValue = arr[i];
      }
    }
    return [maxValue, maxIndex];
  }

  setSquareBase() {
    if (this.planta.vertical) {
      // vertical
      this.squareWidth = this.squareBase;
      this.squareHeight = Math.round(this.squareWidth * this.squareProp);
    } else {
      // horizontal
      this.squareHeight = this.squareBase;
      this.squareWidth = Math.round(this.squareHeight * this.squareProp);
    }
  }

  getPlanta(plantaId: string) {
    this.plantaService.getPlanta(plantaId).subscribe(
      response => {
        this.planta = response;
        this.defaultZoom = this.planta.zoom;

        this.filas_array = [];
        this.columnas_array = [];
        for (let i = 1; i <= this.planta.columnas; i++) {
          this.columnas_array.push(i);
        }
        for (let i = 1; i <= this.planta.filas; i++) {
          this.filas_array.push(i);
        }

        this.setSquareBase();

        this.filasEstructura = this.planta.filas;
        // this.columnasEstructura = this.planta.columnas;
        if (this.planta.tipo !== "2 ejes") {
          this.columnasEstructura = 6; // temporal
        } else {
          this.columnasEstructura = this.planta.columnas;
        }
      },
      error => {
        const errorMessage = error as any;
        if (errorMessage != null) {
          const body = JSON.parse(error._body);
          this.alertMessage = body.message;

          console.log(error);
        }
      }
    );
  }

  getInforme() {
    const informeId = this.route.snapshot.paramMap.get("id");
    // this.route.params.forEach((params: Params) => {
    //   const id = params['id'];

    this.informeService.getInforme(informeId).subscribe(
      response => {
        if (!response) {
          this.router.navigate(["/"]);
          console.log("errorrr 1");
        } else {
          this.informe = response;
          // this.min_temp = this.informe.tempMin;
          // this.max_temp = this.informe.tempMax;

          this.getPolygonList(this.informe.plantaId);
          this.getPlanta(this.informe.plantaId);
          // Cogemos todos los pcs de esta informe
          this.getPcsList();
          this.titulo = this.informe.fecha * 1000;
          // Obtener lista de imagenes de la carpeta
          this.informeService
            .getFileList(
              this.pathJoin([this.informe.carpetaBase, GLOBAL.carpetaJpgGray])
            )
            .subscribe(
              response2 => {
                if (!response2) {
                  this.alertMessage = "No hay archivos";
                } else {
                  this.flights_data = response2;
                  this.flights_list = Object.keys(this.flights_data);
                  this.flights_list.sort();
                  this.fileList =
                    response2[Object.keys(this.flights_data)[0]].files;
                  this.coords =
                    response2[Object.keys(this.flights_data)[0]].coords;
                  this.setImageFromRangeValue(1);
                }
              },
              error => {
                const errorMessage = error;
                if (errorMessage != null) {
                  const body = JSON.parse(error._body);
                  this.alertMessage = body.message;
                  console.log(error);
                }
              }
            );
        }
      },
      error => {
        const errorMessage = error;
        if (errorMessage != null) {
          const body = JSON.parse(error._body);
          this.alertMessage = body.message;

          console.log(error);
        }
      }
    );
  }

  sortPcs(array: PcInterface[]) {
    array.sort((a: PcInterface, b: PcInterface) => {
      if (a.local_id > b.local_id) {
        return -1;
      } else {
        return 1;
      }
    });
    return array;
  }

  filterPcsByFlight(currentFlight: string) {
    if (typeof this.allPcs !== "undefined") {
      return this.allPcs.filter(x => x.vuelo === currentFlight);
    }
  }

  getPcsList(vuelo?: string) {
    this.pcService
      .getPcsInformeEdit(this.informe.id)
      .pipe(
        take(1),
        map(pcList => {
          pcList.map(pc => {
            pc.color = "black";
            return pc;
          });
          return pcList;
        })
      )
      .subscribe(
        response => {
          if (!response || response.length === 0) {
            this.alertMessage = "No hay puntos calientes";
          } else {
            this.alertMessage = null;
            this.allPcs = response;
            if (vuelo != null) {
              this.allPcs = this.sortPcs(this.allPcs).filter(arr => {
                return arr.vuelo === vuelo;
              });
            } else {
              this.allPcs = this.sortPcs(this.allPcs);
            }

            this.localIdCount = this.allPcs[0].local_id;
          }

          // if (this.DEFAULT_LAT == null || this.DEFAULT_LNG == null) {
          //     this.DEFAULT_LAT = this.allPcs[0].gps_lat;
          //     this.DEFAULT_LNG = this.allPcs[0].gps_lng;
          // }
        },
        error => {
          const errorMessage = error;
          if (errorMessage != null) {
            const body = JSON.parse(error._body);
            this.alertMessage = body.message;
            console.log(error);
          }
        }
      );
  }

  addPcToDb(pc: PcInterface) {
    this.pcService.addPc(pc);
    this.allPcs.push(pc);
    this.allPcs = this.sortPcs(this.allPcs);
    this.selected_pc = pc;
  }

  onInputRange(event) {
    this.selected_pc = null;
    const value = parseInt(event.target.value, 10);
    this.setImageFromRangeValue(value);
  }
  onClickNext(rangeValue) {
    if (this.selected_pc !== null) {
      this.selected_pc = null;
    }
  }

  getDateTimeFromDateAndTime(date: string, time: string) {
    const dateSplitted = date.split(".");
    const year = parseInt(dateSplitted[2], 10);
    const month = parseInt(dateSplitted[1], 10);
    const day = parseInt(dateSplitted[0], 10);

    const timeSplitted = time.split(":");
    const hours = parseInt(timeSplitted[0], 10);
    const minutes = parseInt(timeSplitted[1], 10);
    const seconds = parseInt(timeSplitted[2], 10);

    return (
      new Date(
        year,
        month - 1,
        day,
        hours + this.gmt_hours_diff,
        minutes,
        seconds
      ).getTime() / 1000
    );
  }

  setImageFromRangeValue(value) {
    value = parseInt(value, 10);
    this.buildingEstructura = false;

    if (this.rangeValue !== value) {
      this.rangeValue = value;
    }
    // El input es el 'value' del slider
    // Para pasar del value del slider al indice de 'fileList' o '/coords' hay que restarle uno
    const arrayIndex = value - 1;

    this.current_datetime = this.getDateTimeFromDateAndTime(
      this.coords[arrayIndex].Date,
      this.coords[arrayIndex].Time
    );
    this.current_gps_lat = parseFloat(
      this.coords[arrayIndex + this.current_gps_correction].Latitude
    );
    this.current_gps_lng = parseFloat(
      this.coords[arrayIndex + this.current_gps_correction].Longitude
    );
    this.current_track_heading = Math.round(
      this.coords[arrayIndex].TrackHeading
    );
    this.current_image_rotation = this.getCurrentImageRotation(
      this.current_track_heading
    );

    this.currentFileName = this.fileList[arrayIndex];
    this.addFabricImage(
      this.informeService.getImageUrl(
        this.pathJoin([this.informe.carpetaBase, GLOBAL.carpetaJpgGray]),
        this.currentFlight,
        this.fileList[arrayIndex]
      )
    );

    // Añadir cuadrados de los pc
    for (let pc of this.allPcs) {
      if (pc.archivo === this.currentFileName) {
        this.drawPcInCanvas(pc);
      }
    }

    // Añadir Estructura
    this.estructura = this.crearNuevaEstructura("");

    this.informeService
      .getEstructuraInforme(this.informe.id, this.currentFileName)
      .subscribe(est => {
        if (est.length > 0) {
          this.estructuraOn = true;
          this.estructura = est[0];
          this.getAllPointsEstructura(this.estructura);
        } else {
          this.estructuraOn = false;
        }
      });

    // TODO - Añadir numero de vuelo
  }

  onMapMarkerClick(pc: PcInterface, fetchPcs = false) {
    if (this.selected_pc !== pc && this.selected_pc) {
      this.selected_pc.color = "black";
    }
    // Cambiar el color del marker
    this.selected_pc = pc;
    this.selected_pc.color = "white";

    if (pc.vuelo !== this.currentFlight) {
      this.changeFlight(pc.vuelo);
    }

    if (fetchPcs) {
      this.getPcsList(this.currentFlight);
    }

    // Poner imagen del pc

    const sliderValue = this.fileList.indexOf(pc.archivo);
    if (sliderValue === this.rangeValue - 1) {
      this.canvas.getObjects().forEach(object => {
        if (object.isType("rect")) {
          object.set(
            "strokeWidth",
            object.local_id === this.selected_pc.local_id
              ? this._selectedStrokeWidth
              : 1
          );
          object.set(
            "selectable",
            object.local_id === this.selected_pc.local_id
          );

          if (!object.ref) {
            // Si no es referencia
            if (object.local_id === this.selected_pc.local_id) {
              // this.canvas.setActiveObject(object);
            }
            object.set(
              "stroke",
              object.local_id === this.selected_pc.local_id ? "white" : "red"
            );
          }
        }
      });

      this.canvas.renderAll();
    } else {
      this.rangeValue = sliderValue + 1;
      this.setImageFromRangeValue(this.rangeValue);
    }

    // // Sumar 1 y cambiar la imagen

    // Cambiar el 'value' del input slider

    // Dibujar pc dentro de la imagen (recuadro y triangulo)
    // transformar coordenadas a rotated
    // const rotatedPcCoords = this.transformCoordsToRotated(pc.img_x, pc.img_y);

    // this.drawTriangle(rotatedPcCoords.x, rotatedPcCoords.y);
  }

  onClickDeletePc(pc: PcInterface) {
    // Eliminamos el PC de la bbdd
    this.delPcFromDb(pc);

    // Eliminamos el cuadrado
    this.selected_pc = null;
    // Eliminamos el triangulo
    if (this.oldTriangle !== null && this.oldTriangle !== undefined) {
      this.canvas.remove(this.oldTriangle);
    }

    // Eliminamos el pc del canvas
    this.canvas.getObjects().forEach(object => {
      if (object.local_id === pc.local_id) {
        this.canvas.remove(object);
      }
    });

    // Elimminamos el pc de la lista
    const index: number = this.allPcs.indexOf(pc);
    if (index !== -1) {
      this.allPcs.splice(index, 1);
    }
  }

  delPcFromDb(pc: PcInterface) {
    this.pcService.delPc(pc);
  }

  onMarkerDragEnd(pc: PcInterface, event) {
    this.onMapMarkerClick(pc);
    pc.gps_lat = event.coords.lat;
    pc.gps_lng = event.coords.lng;
    let globalX;
    let globalY;
    let modulo;

    pc.image_rotation = this.current_image_rotation;

    [globalX, globalY, modulo] = this.getGlobalCoordsFromLocationArea(
      event.coords
    );

    this.updateLocalAreaInPc(pc, globalX, globalY, modulo);
  }

  updateLocalAreaInPc(pc, globalX, globalY, modulo) {
    if (globalX.length > 0) {
      pc.global_x = globalX;
    }
    if (globalY.length > 0) {
      pc.global_y = globalY;
    }

    if (Object.entries(modulo).length > 0 && modulo.constructor === Object) {
      pc.modulo = modulo;
    }

    pc.datetime = this.current_datetime;
    this.updatePcInDb(pc);
  }

  onClickLocalCoordsTable(selectedPc: PcInterface, f: number, c: number) {
    if (this.selected_pc === selectedPc) {
      if (this.planta.tipo === "2 ejes") {
        this.selected_pc.local_x = c;
        this.selected_pc.local_y = f;
      } else {
        this.selected_pc.local_y = f;
      }
    }
    this.updatePcInDb(selectedPc);
  }

  updatePcInDb(pc: PcInterface) {
    this.pcService.updatePc(pc);

    // Actualizar this.allPcs
    this.allPcs = this.allPcs.map(element => {
      if (pc.id === element.id) {
        return pc;
      } else {
        return element;
      }
    });
  }

  drawPcInCanvas(pc: PcInterface) {
    const rect2 = new fabric.Rect({
      left: pc.img_left,
      top: pc.img_top,
      fill: "rgba(0,0,0,0)",
      stroke: "red",
      strokeWidth: 1,
      hasControls: false,
      width: pc.img_width,
      height: pc.img_height,
      local_id: pc.local_id,
      ref: false,
      hasRotatingPoint: false
    });
    const rectRef2 = new fabric.Rect({
      left: pc.refLeft,
      top: pc.refTop,
      fill: "rgba(0,0,0,0)",
      stroke: "red",
      strokeWidth: 1,
      hasControls: false,
      width: pc.refWidth,
      height: pc.refHeight,
      local_id: pc.local_id,
      ref: false,
      hasRotatingPoint: false
    });

    const transformedRect = this.transformActObjToRotated(rect2);
    const transformedRectRef = this.transformActObjToRotated(rectRef2);
    const strokWidth =
      pc.local_id === this.selected_pc.local_id ? this._selectedStrokeWidth : 1;

    const rect = new fabric.Rect({
      left: transformedRect.left,
      top: transformedRect.top,
      fill: "rgba(0,0,0,0)",
      stroke: pc.local_id === this.selected_pc.local_id ? "white" : "red",
      strokeWidth: strokWidth,
      hasControls: true,
      width: transformedRect.width,
      height: transformedRect.height,
      local_id: pc.local_id,
      ref: false,
      hasRotatingPoint: false
    });

    const rectRef = new fabric.Rect({
      left: transformedRectRef.left,
      top: transformedRectRef.top,
      fill: "rgba(0,0,0,0)",
      stroke: "blue",
      strokeWidth: strokWidth,
      hasControls: true,
      width: transformedRectRef.width,
      height: transformedRectRef.height,
      local_id: pc.local_id,
      ref: true,
      selectable: pc.local_id === this.selected_pc.local_id,
      hasRotatingPoint: false
    });

    this.canvas.add(rect);
    this.canvas.add(rectRef);
    if (pc.local_id === this.selected_pc.local_id) {
      this.canvas.setActiveObject(rect);
    }
  }

  onClickFlightsCheckbox(event) {
    if (event.target) {
      this.changeFlight(event.target.id);
      this.setImageFromRangeValue(1);
      this.rangeValue = 1;
    }
  }

  changeFlight(flightName) {
    this.currentFlight = flightName;
    this.fileList = this.flights_data[flightName].files;
    this.coords = this.flights_data[flightName].coords;
  }

  onClickPcTable(event, pc: PcInterface) {
    this.changeFlight(pc.vuelo);
  }
  onClickNextImage(event) {
    this.rangeValue += 1;
  }
  onClickEstructura() {
    console.log("buildingEstructura", this.buildingEstructura);
  }
  crearNuevaEstructura(fileName): Estructura {
    this.columnaInicioEstructura = 1;
    return <Estructura>{
      filename: fileName,
      coords: Array(),
      sentido: this.sentidoEstructura,
      columnaInicio: this.columnaInicioEstructura
    };
  }

  onClickBuildEstructura(event) {
    if (this.buildingEstructura) {
      if (this.currentFileName !== this.estructura.filename) {
        this.estructura = this.crearNuevaEstructura(this.currentFileName);
      }
      this.estructura.coords.push({ x: event.offsetX, y: event.offsetY });

      this.canvas.add(
        new fabric.Circle({
          left: event.offsetX - 1,
          top: event.offsetY - 1,
          radius: 2,
          fill: "red",
          selectable: false
        })
      );

      if (this.estructura.coords.length === 4) {
        this.buildingEstructura = false;
        this.estructura.filas = this.filasEstructura;
        this.estructura.columnas = this.columnasEstructura;
        this.getAllPointsEstructura(this.estructura);

        this.informeService.addEstructuraInforme(
          this.informe.id,
          this.estructura
        );
        this.estructura.coords = Array();
      }
    }
  }

  onClickDeleteEstructura() {
    this.informeService.deleteEstructuraInforme(
      this.informe.id,
      this.currentFileName
    );
    this.setImageFromRangeValue(this.rangeValue);
  }

  getAllPointsEstructura(estructura) {
    this.estructuraMatrix = [];
    for (let i = 0; i < estructura.filas + 1; i++) {
      this.estructuraMatrix[i] = new Array(estructura.columnas + 1);
    }

    let ladosEstructura = [];

    // 1 - Obtenemos coords (x,y) de los cuatro lados
    // [0, 1, 2, 3] == [tl, tr, br, bl] el poligono tiene 4 esquinas

    for (let i = 0; i < 4; i++) {
      // para cada esquina ...
      const p1 = estructura.coords[i];
      let p2 = estructura.coords[i + 1];

      let numeroDivisiones: number;
      if (i === 0) {
        // top-left/bottom-right, inicio de columna
        numeroDivisiones = estructura.columnas;
        this.estructuraMatrix[0][0] = p1;
      } else if (i === 1) {
        // top-right
        numeroDivisiones = estructura.filas;
        this.estructuraMatrix[0][estructura.columnas] = p1;
      } else if (i === 2) {
        // bottom-right
        numeroDivisiones = estructura.columnas;
        this.estructuraMatrix[estructura.filas][estructura.columnas] = p1;
      } else if (i === 3) {
        // bottom-left
        numeroDivisiones = estructura.filas;
        this.estructuraMatrix[estructura.filas][0] = p1;
        // si la esquina es la numero 3 (bottom-left), entonces p2 es top-left
        p2 = estructura.coords[0];
      }

      // Obtenemos la ecuacion de la recta (y = mx+b)

      const m = (p2.y - p1.y) / (p2.x - p1.x);
      const b = isFinite(m) ? p2.y - m * p2.x : p1.x;

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
    const [r1_m, r1_b] = this.rectaPor2Puntos(pf1, pf2);

    // 4 - Hallar Recta2 paralela a Recta1 y que paso por un punto interno a la estructura
    const pInterno = {
      x: (Math.max(tl.x, bl.x) + Math.min(tr.x, br.x)) * 0.5,
      y: (Math.max(tl.y, tr.y) + Math.min(br.y, bl.y)) * 0.5
    };
    const r2_m = r1_m;
    const r2_b = pInterno.y - r2_m * pInterno.x;

    // 5 - Hallar interseccion de Recta2 con lado superior (p0), lado derecho (p1), lado inferior (p2) y lado izquierdo(p3)
    const p0 = this.interseccionRectas(
      r2_m,
      r2_b,
      ladosEstructura[0][0],
      ladosEstructura[0][1]
    );
    const p1 = this.interseccionRectas(
      r2_m,
      r2_b,
      ladosEstructura[1][0],
      ladosEstructura[1][1]
    );
    const p2 = this.interseccionRectas(
      r2_m,
      r2_b,
      ladosEstructura[2][0],
      ladosEstructura[2][1]
    );
    const p3 = this.interseccionRectas(
      r2_m,
      r2_b,
      ladosEstructura[3][0],
      ladosEstructura[3][1]
    );

    // 6a - Para cada filas
    // 6a.1 Dividir en f=filas partes iguales el segmento p0-p2
    const divFilas = Math.abs(p0.x - p2.x) / estructura.filas;
    for (let fila = 1; fila < estructura.filas; fila++) {
      // 6a.2 Hallar Recta3 interseccion de dicho punto con pf1
      const sentido = p0.x > p2.x ? -1 : 1;

      const xDiv = p0.x + sentido * fila * divFilas;
      const yDiv = xDiv * r2_m + r2_b;
      const pDiv = { x: xDiv, y: yDiv };

      const [r3_m, r3_b] = this.rectaPor2Puntos(pf1, pDiv);

      // 6a.2 Hallar interseccion de Recta3 con lado izquierdo (p5) y lado derecho (p6)
      const p5 = this.interseccionRectas(
        r3_m,
        r3_b,
        ladosEstructura[3][0],
        ladosEstructura[3][1]
      );
      const p6 = this.interseccionRectas(
        r3_m,
        r3_b,
        ladosEstructura[1][0],
        ladosEstructura[1][1]
      );

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
      const yDiv = xDiv * r2_m + r2_b;
      const pDiv = { x: xDiv, y: yDiv };

      const [r4_m, r4_b] = this.rectaPor2Puntos(pf2, pDiv);
      // 6b.2 Hallar interseccion de Recta4 con lado inferior (p7) y lado superior (p8)
      const p7 = this.interseccionRectas(
        r4_m,
        r4_b,
        ladosEstructura[2][0],
        ladosEstructura[2][1]
      );
      const p8 = this.interseccionRectas(
        r4_m,
        r4_b,
        ladosEstructura[0][0],
        ladosEstructura[0][1]
      );

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
          y: Math.round(pInterseccion.y)
        };
      }
    }

    this.dibujarEstructuraMatrix(this.estructuraMatrix);
  }

  private interseccionRectas(
    m1: number,
    b1: number,
    m2: number,
    b2: number
  ): Punto {
    if (!isFinite(m1)) {
      return { x: b1, y: m2 * b1 + b2 };
    } else if (!isFinite(m2)) {
      return { x: b2, y: m1 * b2 + b1 };
    }
    let x = (b1 - b2) / (m2 - m1);
    const y = Math.round(m1 * x + b1);
    x = Math.round(x);
    return { x, y };
  }

  private rectaPor2Puntos(p1: Punto, p2: Punto) {
    const m = (p2.y - p1.y) / (p2.x - p1.x);
    if (!isFinite(m)) {
      const b = p1.x;
      return [m, b];
    }
    const b = p2.y - m * p2.x;
    return [m, b]; // y = m * x + b
  }

  dibujarEstructuraMatrix(estructuraMatrix: any[]) {
    estructuraMatrix.forEach(fila => {
      fila.forEach(punto => {
        this.canvas.add(
          new fabric.Circle({
            left: punto.x - 1,
            top: punto.y - 1,
            radius: 2,
            fill: "red",
            selectable: false
          })
        );
      });
    });

    this.canvas.on("object:moving", options => {
      if (this.estructuraOn && options.target.ref === false) {
        const puntoDistMin = this.getPointDistanciaMin(
          options.pointer.x,
          options.pointer.y,
          estructuraMatrix
        );
        options.target.set({
          left: puntoDistMin.x,
          top: puntoDistMin.y
        });
      }
    });
  }

  getPointDistanciaMin(x: number, y: number, estructuraMatrix: any[]) {
    let distanciaMinima = 99999;
    let puntoDistanciaMin;

    estructuraMatrix.forEach(fila => {
      fila.forEach(punto => {
        const distancia = Math.abs(punto.x - x) + Math.abs(punto.y - y);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          puntoDistanciaMin = punto;
        }
      });
    });
    let fila;
    let columna;

    [fila, columna] = this.calcularFilaColumna(
      puntoDistanciaMin.x + 10,
      puntoDistanciaMin.y + 10
    );

    this.selected_pc.local_x = columna;
    this.selected_pc.local_y = fila;

    return puntoDistanciaMin;
  }

  calcularFilaColumna(x: number, y: number) {
    let distanciaMinima = 999999;
    let columnaDistMin;
    let filaDistMin;

    for (let fila = 1; fila < this.estructura.filas + 1; fila++) {
      for (let col = 1; col < this.estructura.columnas + 1; col++) {
        // Para cada modulo ...
        let distancia = 0;
        for (let i = 0; i < 2; i++) {
          //horizontal
          for (let j = 0; j < 2; j++) {
            //vertical
            // para cada esquina, sumamos distancia

            const p = this.estructuraMatrix[fila - 1 + i][col - 1 + j];

            distancia =
              distancia +
              Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
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

  updateEstructura(event) {
    if (this.estructura.filename === this.currentFileName) {
      this.estructura.filas = this.filasEstructura;
      this.estructura.columnas = this.columnasEstructura;
      this.estructura.columnaInicio = this.columnaInicioEstructura;
      this.estructura.sentido = this.sentidoEstructura;
      this.informeService.updateEstructura(this.informe.id, this.estructura);
      this.setImageFromRangeValue(this.rangeValue);
    }
  }

  getPolygonList(plantaId: string) {
    this.plantaService.getLocationsArea(plantaId).subscribe(items => {
      this.polygonList = [];
      items.forEach(locationArea => {
        this.map._mapsWrapper
          .createPolygon({
            paths: locationArea.path,
            strokeColor: "#FF0000",
            visible: false,
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: "grey",
            fillOpacity: 0,
            editable: false,
            draggable: false,
            id: locationArea.id,
            globalX: locationArea.globalX,
            globalY: locationArea.globalY,
            modulo: locationArea.modulo
          })
          .then((polygon: any) => {
            this.polygonList.push(polygon);
          });
      });
    });
  }

  recalcularLocs() {
    this.allPcs.forEach(pc => {
      let globalX;
      let globalY;
      let modulo;

      [globalX, globalY, modulo] = this.getGlobalCoordsFromLocationArea({
        lat: pc.gps_lat,
        lng: pc.gps_lng
      });
      this.updateLocalAreaInPc(pc, globalX, globalY, modulo);
    });
  }

  getGlobalCoordsFromLocationArea(coords: any) {
    const latLng = new google.maps.LatLng(coords.lat, coords.lng);
    let globalX = "";
    let globalY = "";
    let modulo: ModuloInterface = {};

    for (let i = 0; i < this.polygonList.length; i++) {
      if (
        google.maps.geometry.poly.containsLocation(latLng, this.polygonList[i])
      ) {
        if (this.polygonList[i].globalX.length > 0) {
          globalX = this.polygonList[i].globalX;
        }
        if (this.polygonList[i].globalY.length > 0) {
          globalY = this.polygonList[i].globalY;
        }

        if (this.polygonList[i].hasOwnProperty("modulo")) {
          if (this.polygonList[i].modulo !== undefined) {
            modulo = this.polygonList[i].modulo;
          }
        }
      }
    }

    return [globalX, globalY, modulo];
  }

  private pathJoin(parts: string[], sep = "\\") {
    const separator = sep || "\\";
    let replace = new RegExp(separator + "{1,}", "g");
    const result = parts.join(separator).replace(replace, separator);
    return result;
  }
}
