import { Component, OnInit } from "@angular/core";
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
declare let fabric;

@Component({
  selector: "app-informe-edit",
  templateUrl: "./informe-edit.component.html",
  styleUrls: ["./informe-edit.component.css"],
  providers: [InformeService, PlantaService, PcService]
})
export class InformeEditComponent implements OnInit {
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
  private canvas2;
  public fabImg;
  public fabImg2;
  public squareBase;
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
  private columnas: number;
  private filas: number;
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

    this.image_width = 640;
    this.image_height = 512;

    this.gmt_hours_diff = 2;
    this.manualRotation = false;

    this.allPcs = new Array<PcInterface>();
  }

  ngOnInit() {
    this.getInforme();
    this.canvas = new fabric.Canvas("mainCanvas");
    this.canvas2 = new fabric.Canvas("hiddenCanvas");

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

      this.updatePcInDb(this.selected_pc, false);
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
  onMouseMoveCanvas(event: MouseEvent) {
    // const raw_coords = this.transformCoordsToRaw(event.offsetX, event.offsetY);
    // console.log('offsetX e y', event.offsetX, event.offsetY);
    // console.log('raw_coordsX e y', raw_coords.x, raw_coords.y);
    // const mouseX = raw_coords.x;
    // const mouseY = raw_coords.y;
    // Temperatura puntual
    // console.log('canvas2 size', this.canvas2.height, this.canvas2.width);
    // const mousePositionData = this.canvas2.getContext('2d').getImageData(mouseX , mouseY , 1, 1).data;
    // console.log('mouseX', mouseX, 'mouseY', mouseY);
    // console.log('mousePositionData', mousePositionData);
    // const mouseTemp = this.rgb2temp(mousePositionData[0], mousePositionData[1], mousePositionData[2]);
    // console.log('mouse_temp', mouseTemp);
    // // Coger maxima temperatura de los alrededores
    // const mouseSquare = this.canvas2
    //   .getContext('2d')
    //   .getImageData(
    //     Math.max(0, Math.round(mouseX - this.squareBase / 2)),
    //     Math.max(0, Math.round(mouseY - this.squareBase / 2)),
    //     this.squareBase,
    //     this.squareBase
    //   );
    // Get max temp
    // const mouse_temps_array = [];
    // for (
    //   let i = 0, n = mouseSquare.height * mouseSquare.width * 4;
    //   i < n;
    //   i += 4
    // ) {
    //   mouse_temps_array.push(
    //     this.rgb2temp(
    //       mouseSquare.data[i],
    //       mouseSquare.data[i + 1],
    //       mouseSquare.data[i + 2]
    //     )
    //   ); // i+3 is alpha (the fourth element)
    // }
    // // console.log('mouse_temps_array', mouse_temps_array);
    // const mouse_max_temp_array = this.indexOfMax(mouse_temps_array);
    // // console.log('index_of', mouse_max_temp_array);
    // this.tooltip_temp = mouse_max_temp_array[0];
    //
    // #############################
    // Modificación de HS
    // #############################
    // console.log('x,y', event.offsetX, event.offsetY, 'tx, ty', mouseX, mouseY);
    // const actObj = this.canvas.getActiveObject();
    // // Get HS img coords and draw triangle
    // if (actObj !== null && actObj !== undefined) {
    //   if (actObj.get('type') === 'rect' && actObj.isMoving === true) {
    //     const actObjRaw = this.transformActObjToRaw(actObj);
    //     // const max_temp = this.getMaxTempInActObj(actObj);
    //     // this.selected_pc.temperaturaMax = max_temp.max_temp;
    //     // this.selected_pc.img_x = max_temp.max_temp_x;
    //     // this.selected_pc.img_y = max_temp.max_temp_y;
    //     if (actObjRaw.ref === true) {
    //       // console.log('actObjRaw ref', actObjRaw);
    //       this.selected_pc.refTop = Math.round(actObjRaw.top);
    //       this.selected_pc.refLeft = Math.round(actObjRaw.left);
    //       this.selected_pc.refWidth = Math.round(Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x));
    //       this.selected_pc.refHeight = Math.round(Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y));
    //     } else {
    //       // console.log('NoRef', this.selected_pc);
    //       this.selected_pc.img_top = Math.round(actObjRaw.top);
    //       this.selected_pc.img_left = Math.round(actObjRaw.left);
    //       this.selected_pc.img_width = Math.round(Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x));
    //       this.selected_pc.img_height = Math.round(Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y));
    //     }
    // console.log('selected_pc_mod top, left', this.selected_pc.img_top, this.selected_pc.img_left);
    // this.updatePcInDb(this.selected_pc, false);
    // console.log('RAW: top,left,width, height', actObjRaw.top, actObjRaw.left, actObjRaw.width, actObjRaw.height);
    // console.log('top: ', actObjRaw.top);
    // $('#temp').html(Math.round(temperature*10)/10);
    // $('#max_temp').html( Math.round(temps.max()*10)/10);
    // $('#sq_height').html(squareHeight);
    // $('#sq_width').html(squareWidth);
    //   }
    // }
  }

  // getMaxTempInActObj(actObj) { // en la imagen rotada

  //   // get the color array for the pixels around the mouse
  //   const actObjRaw = this.transformActObjToRaw(actObj);
  //   // console.log('RAW. left, top, width, height', actObjRaw.left, actObjRaw.top, actObjRaw.width, actObjRaw.height);
  //   // console.log('ROT. left, top, width, height', actObj.left, actObj.top, actObj.width, actObj.height);

  //   const actObjData = this.canvas2
  //     .getContext('2d')
  //     .getImageData(actObjRaw.left, actObjRaw.top, actObjRaw.width, actObjRaw.height)
  //     .data;
  //   // let square_pixel_data = this.canvas2.getContext('2d').getImageData(x, y, 1, 1).data;
  //   const act_obj_temps_array = [];

  //   for (let i = 0, n = actObjRaw.height * actObjRaw.width * 4; i < n; i += 4) {
  //     act_obj_temps_array.push(
  //       this.rgb2temp(actObjData[i], actObjData[i + 1], actObjData[i + 2])
  //     );
  //     // i+3 is alpha (the fourth element)
  //   }

  //   const act_obj_max_temp_arr = this.indexOfMax(act_obj_temps_array);
  //   const act_obj_max_temp = act_obj_max_temp_arr[0];
  //   const act_obj_max_index = act_obj_max_temp_arr[1];
  //   const act_obj_max_temp_y_raw = Math.round(
  //     actObjRaw.top + Math.trunc(act_obj_max_index / actObjRaw.width)
  //   );
  //   const act_obj_max_temp_x_raw = Math.round(
  //     actObjRaw.left +
  //       act_obj_max_index -
  //       Math.trunc(act_obj_max_index / actObjRaw.width) * actObjRaw.width
  //   );

  //   // draw triangle
  //   // convertir a coordenadas de canvas1
  //   const act_obj_max_temp_rotated = this.transformCoordsToRotated(act_obj_max_temp_x_raw, act_obj_max_temp_y_raw);

  //   // console.log('TRIANGLE RAW: rotated_x: ', act_obj_max_temp_x_raw, 'rotated_y: ', act_obj_max_temp_y_raw);
  //   // console.log('TRIANGLE: rotated_x: ', act_obj_max_temp_rotated.x, 'rotated_y: ', act_obj_max_temp_rotated.y);
  //   // this.drawTriangle(act_obj_max_temp_rotated.x, act_obj_max_temp_rotated.y);
  //   // this.drawTriangle2(act_obj_max_temp_x_raw, act_obj_max_temp_y_raw);
  //   // console.log('max_temp:', act_obj_max_temp, 'x, y: ', act_obj_max_temp_x_raw, act_obj_max_temp_y_raw);

  //   this.pc_temp = Math.round(act_obj_max_temp * 10) / 10;

  //   // report that pixel data
  //   return {
  //     max_temp: act_obj_max_temp,
  //     max_temp_x: act_obj_max_temp_x_raw,
  //     max_temp_y: act_obj_max_temp_y_raw
  //   };
  // }

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
          top: leftAndTop.top
          // originX: 'top',
          // originY: 'left'
        }
      );
      this.fabImg = image;
    });

    this.canvas2.clear();
    const img2 = new Image();
    img2.src = imgSrc;
    img2.setAttribute("crossOrigin", "anonymous");
    img2.onload = ev => {
      img2.setAttribute("crossOrigin", "anonymous");
      if (this.fabImg2) {
        this.canvas2.remove(this.fabImg2);
      }
      this.fabImg2 = new fabric.Image(img2, {
        // left: leftAndTop.left,
        // top: leftAndTop.top,
        // angle: this.current_image_rotation,
        crossOrigin: "Anonymous",
        selectable: false
      });
      this.canvas2.add(this.fabImg2);
    };
  }

  onDblClickCanvas(event) {
    const leftCoord = event.offsetX - this.squareWidth / 2;
    const topCoord = event.offsetY - this.squareHeight / 2;
    this.localIdCount += 1;
    const actObj = new fabric.Rect({
      left: leftCoord,
      top: topCoord,
      fill: "rgba(0,0,0,0)",
      stroke: "red",
      strokeWidth: 1,
      width: this.squareWidth,
      height: this.squareHeight,
      hasControls: true,
      local_id: this.localIdCount,
      ref: false,
      hasRotatingPoint: false
    });

    const actObjRef = new fabric.Rect({
      left: leftCoord + this.squareWidth + 30,
      top: topCoord,
      fill: "rgba(0,0,0,0)",
      stroke: "blue",
      strokeWidth: 1,
      width: this.squareWidth,
      height: this.squareHeight,
      hasControls: true,
      local_id: this.localIdCount,
      ref: true,
      hasRotatingPoint: false
    });

    this.canvas.add(actObj);
    this.canvas.add(actObjRef);
    this.canvas.setActiveObject(actObj);

    const actObjRawCoords = this.transformActObjToRaw(actObj);
    const actObjRefRawCoords = this.transformActObjToRaw(actObjRef);
    // const act_obj_raw = new fabric.Rect({
    //   left: actObjRawCoords.left,
    //   top: actObjRawCoords.top,
    //   fill: 'rgba(0,0,0,0)',
    //   stroke: 'red',
    //   strokeWidth: 1,
    //   hasControls: false,
    //   width: actObjRawCoords.width,
    //   height: actObjRawCoords.height,
    //   local_id: this.localIdCount
    // });
    // this.canvas2.add(act_obj_raw);
    // this.canvas2.setActiveObject(act_obj_raw);

    const newPc: PcInterface = {
      id: "",
      archivo: this.currentFileName,
      tipo: 8, // tipo (celula caliente por defecto)
      local_x: 1, // local_x
      local_y: 0, // local_x
      global_x: 0, // global_x
      global_y: "", // global_y
      gps_lng: this.current_gps_lng,
      gps_lat: this.current_gps_lat,
      img_left: actObjRawCoords.left,
      img_top: actObjRawCoords.top,
      img_width: actObjRawCoords.width,
      img_height: actObjRawCoords.height,
      img_x: 0, // coordenadas raw
      img_y: 0, // coordenadas raw
      local_id: this.localIdCount,
      vuelo: this.currentFlight,
      image_rotation: this.current_image_rotation,
      informeId: this.informe.id,
      datetime: this.current_datetime,
      resuelto: false,
      color: "black",
      refTop: actObjRefRawCoords.top,
      refLeft: actObjRefRawCoords.left,
      refHeight: actObjRefRawCoords.height,
      refWidth: actObjRefRawCoords.width
    };

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
    // this.updatePcInDb(newPc, true);
    this.onMapMarkerClick(newPc);
  }

  onMouseUpCanvas(event) {
    const actObj = this.canvas.getActiveObject();

    if (actObj !== null && actObj !== undefined) {
      if (actObj.get("type") === "rect") {
        const actObjRaw = this.transformActObjToRaw(actObj);
        this.selectPcFromLocalId(actObj.local_id);
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
      this.squareHeight = Math.round((this.squareWidth * 3) / 2);
    } else {
      // horizontal
      this.squareHeight = this.squareBase;
      this.squareWidth = Math.round((this.squareHeight * 3) / 2);
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

          this.getPlanta(this.informe.plantaId);
          // Cogemos todos los pcs de esta informe
          this.getPcsList();
          this.titulo = this.informe.fecha * 1000;
          // Obtener lista de imagenes de la carpeta
          this.informeService.getFileList(this.informe.carpeta).subscribe(
            response2 => {
              if (!response2) {
                this.alertMessage = "No hay archivos";
              } else {
                this.flights_data = response2;
                this.flights_list = Object.keys(this.flights_data);
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
      .getPcs(this.informe.id)
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
        this.informe.carpeta,
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
    this.canvas.discardActiveObject();
    // Añadir numero de vuelo
    // TODO

    // console.log('selected_pc', this.selected_pc);
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
    // // Obtener el indice de la imagen
    const sliderValue = this.fileList.indexOf(pc.archivo);
    // // Sumar 1 y cambiar la imagen
    this.setImageFromRangeValue(sliderValue + 1);

    // Cambiar el 'value' del input slider
    this.rangeValue = sliderValue + 1;
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

    // TODO Eliminamos el cuadrado dentro de la
  }

  delPcFromDb(pc: PcInterface) {
    this.pcService.delPc(pc);
  }

  onMarkerDragEnd(pc: PcInterface, event) {
    this.onMapMarkerClick(pc);
    pc.gps_lat = event.coords.lat;
    pc.gps_lng = event.coords.lng;
    pc.image_rotation = this.current_image_rotation;

    pc.datetime = this.current_datetime;
    this.updatePcInDb(pc, false);
  }
  onClickLocalCoordsTable(selectedPc: PcInterface, f: number, c: number) {
    if (this.selected_pc === selectedPc) {
      if (this.planta === "2 ejes") {
        this.selected_pc.local_x = c;
        this.selected_pc.local_y = f;
      } else {
        this.selected_pc.local_y = f;
      }
    }
    this.updatePcInDb(selectedPc, false);
  }

  updatePcInDb(pc: PcInterface, updateAll: boolean = false) {
    this.pcService.updatePc(pc);

    // if (updateAll) {
    // Actualizar this.allPcs
    this.allPcs = this.allPcs.map(element => {
      if (pc.id === element.id) {
        return pc;
      } else {
        return element;
      }
    });
    // }
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

    this.canvas2.add(rect2);
    this.canvas2.setActiveObject(rect2);

    const transformedRect = this.transformActObjToRotated(rect2);
    const transformedRectRef = this.transformActObjToRotated(rectRef2);

    const rect = new fabric.Rect({
      left: transformedRect.left,
      top: transformedRect.top,
      fill: "rgba(0,0,0,0)",
      stroke: "red",
      strokeWidth: 1,
      hasControls: true,
      width: transformedRect.width,
      height: transformedRect.height,
      local_id: pc.local_id,
      ref: false
    });

    const rectRef = new fabric.Rect({
      left: transformedRectRef.left,
      top: transformedRectRef.top,
      fill: "rgba(0,0,0,0)",
      stroke: "blue",
      strokeWidth: 1,
      hasControls: true,
      width: transformedRectRef.width,
      height: transformedRectRef.height,
      local_id: pc.local_id,
      ref: true
    });

    this.canvas.add(rect);
    this.canvas.add(rectRef);

    this.canvas.setActiveObject(rect);
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
}
