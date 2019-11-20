import { Component, OnInit, Inject } from "@angular/core";
import { PcInterface } from "src/app/models/pc";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { DialogData } from "../pc-map/pc-map.component";
import { GLOBAL } from "src/app/services/global";
import { AngularFireStorage } from "@angular/fire/storage";
import "fabric";
declare let fabric;

import Pica from "pica";
import { take } from "rxjs/operators";
import { PlantaInterface } from "../../models/planta";
import { InformeInterface } from "../../models/informe";
import { AuthService } from "src/app/services/auth.service";
import { UserInterface } from "src/app/models/user";
import { PcService } from "../../services/pc.service";
import { PlantaService } from "../../services/planta.service";

const pica = Pica();

@Component({
  selector: "app-pc-details-dialog",
  templateUrl: "./pc-details-dialog.component.html",
  styleUrls: ["./pc-details-dialog.component.css"]
})
export class PcDetailsDialogComponent implements OnInit {
  // public tooltipTemp: number;
  private maxTemp: number;
  private minTemp: number;
  private canvas: any;
  public user: UserInterface;

  // private hiddenCanvas: any;
  // private tooltipElement: any;
  public pcDescripcion: string[];
  public pcCausa: string[];
  public pcRecomendacion: string[];
  public pcPerdidas: number[];
  public oldTriangle;
  public oldActObjRef1;
  public oldActObjRef2;
  public oldTextRef;
  public oldTextTriangle;
  public slider;
  public visualCanvas;
  public magnifier;
  public imagenVisual;
  public imagenTermica;
  public zoomSquare = 200;
  public pc: PcInterface;
  public allPcs: PcInterface[];
  public planta: PlantaInterface;
  public informe: InformeInterface;
  public sinPcs: boolean;
  public imagenVisualCargada: boolean;
  public imagenTermicaCargada: boolean;

  constructor(
    public pcService: PcService,
    public auth: AuthService,
    private storage: AngularFireStorage,
    public dialogRef: MatDialogRef<PcDetailsDialogComponent>,
    public plantaService: PlantaService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.minTemp = 41;
    this.maxTemp = 70;
    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.pcCausa = GLOBAL.pcCausa;
    this.pcRecomendacion = GLOBAL.pcRecomendacion;
    this.pcPerdidas = GLOBAL.pcPerdidas;

    this.pc = data.pc;
    this.allPcs = data.allPcs;
    this.planta = data.planta;
    this.informe = data.informe;
    this.sinPcs = data.sinPcs;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {}

  ngAfterViewInit() {}

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.user = user;
    });
    this.imagenVisualCargada = false;
    this.imagenTermicaCargada = false;
    this.canvas = new fabric.Canvas("dialog-canvas");
    this.visualCanvas = new fabric.Canvas("visual-canvas");
    this.setEventListenersCanvas();
    // this.hiddenCanvas = new fabric.Canvas('hidden-canvas');

    this.imagenTermica = new Image();
    this.imagenVisual = new Image();
    this.imagenTermica.crossOrigin = "anonymous";
    this.imagenVisual.crossOrigin = "anonymous";

    this.pc.downloadUrl$.pipe(take(1)).subscribe(url => {
      this.pc.downloadUrlString = url;
      this.imagenTermica.src = url;
    });
    if (!this.informe.hasOwnProperty("jpgVisual") || this.informe.jpgVisual)
      this.pc.downloadUrlVisual$.pipe(take(1)).subscribe(url => {
        this.pc.downloadUrlStringVisual = url;
        this.imagenVisual.src = url;
      });

    this.imagenVisual.onload = () => {
      pica
        .resize(this.imagenVisual, this.visualCanvas, {
          unsharpAmount: 80,
          unsharpRadius: 0.6,
          unsharpThreshold: 2
        })
        .then(res => {
          this.imagenVisualCargada = true;
        });
      // this.visualCanvas.getContext('2d').drawImage(this.imagenVisual, 0, 0 );
    };

    this.imagenTermica.onload = () => {
      this.imagenTermicaCargada = true;
      if (!this.sinPcs) {
        // Dibujar all pcs
        this.drawAllPcsInCanvas();
        // Seleccionar pc
        this.selectPc(this.pc);
      }
      // this.hiddenCanvas.getContext('2d').drawImage(this.imagenTermica, 0, 0 );
      this.canvas.setBackgroundImage(
        new fabric.Image(this.imagenTermica, {
          left: 0,
          top: 0,
          angle: 0,
          opacity: 1,
          draggable: false,
          lockMovementX: true,
          lockMovementY: true
        }),
        this.canvas.renderAll.bind(this.canvas),
        {
          // scaleX: this.canvas.width / image.width,
          // scaleY: this.canvas.height / image.height,
          crossOrigin: "anonymous",
          left: 0,
          top: 0
          // originX: 'top',
          // originY: 'left'
        }
      );
    };
    // this.tooltipElement = document.getElementById("dialog-tooltip");
  }

  selectPc(pc: PcInterface) {
    this.drawObjRef(pc);
    this.drawTriangle(pc);
    this.pc = pc;
  }

  drawAllPcsInCanvas() {
    const seguidorPcs = this.allPcs.filter((pc, i, pcArray) => {
      return pc.archivo === this.pc.archivo;
    });

    seguidorPcs.forEach((pc, i, a) => {
      this.drawPc(pc);
    });
  }

  drawPc(pc: PcInterface) {
    const actObj1 = new fabric.Rect({
      left: pc.img_left,
      top: pc.img_top,
      fill: "rgba(0,0,0,0)",
      stroke: "black",
      strokeWidth: 1,
      width: pc.img_width,
      height: pc.img_height,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      selectable: false,
      hoverCursor: "default"
    });
    const actObj2 = new fabric.Rect({
      left: pc.img_left - 1,
      top: pc.img_top - 1,
      fill: "rgba(0,0,0,0)",
      stroke: "red",
      strokeWidth: 1,
      width: pc.img_width + 2,
      height: pc.img_height + 2,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      hoverCursor: "pointer",
      selectable: true
    });
    const textId = new fabric.Text(
      "#".concat(pc.local_id.toString().concat(" ")),
      {
        left: pc.img_left,
        top: pc.img_top - 26,
        fontSize: 20,
        // textBackgroundColor: 'red',
        ref: "text",
        selectable: false,
        hoverCursor: "default",
        fill: "white"
      }
    );

    this.canvas.add(actObj1);
    this.canvas.add(actObj2);
    this.canvas.add(textId);
    this.canvas.renderAll();
  }

  private drawObjRef(pc: PcInterface) {
    if (
      this.oldActObjRef1 !== null &&
      this.oldActObjRef1 !== undefined &&
      this.oldActObjRef2 !== null &&
      this.oldActObjRef2 !== undefined
    ) {
      this.canvas.remove(this.oldActObjRef1);
      this.canvas.remove(this.oldActObjRef2);
      this.canvas.remove(this.oldTextRef);
    }
    const actObjRef1 = new fabric.Rect({
      left: pc.refLeft,
      top: pc.refTop,
      fill: "rgba(0,0,0,0)",
      stroke: "blue",
      strokeWidth: 1,
      width: pc.refWidth,
      height: pc.refHeight,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      selectable: false,
      localId: pc.local_id,
      ref: true,
      hoverCursor: "default"
    });
    const actObjRef2 = new fabric.Rect({
      left: pc.refLeft - 1,
      top: pc.refTop - 1,
      fill: "rgba(0,0,0,0)",
      stroke: "white",
      strokeWidth: 1,
      width: pc.refWidth + 2,
      height: pc.refHeight + 2,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      selectable: false,
      localId: pc.local_id,
      ref: true,
      hoverCursor: "default"
    });
    const TextRef = new fabric.Text(
      "Ø ".concat(pc.temperaturaRef.toString().concat(" ºC ")),
      {
        left: pc.refLeft,
        top: pc.refTop - 16,
        fontSize: 13,
        textBackgroundColor: "white",
        ref: "text",
        selectable: false,
        hoverCursor: "default",
        fill: "blue"
      }
    );

    this.oldActObjRef1 = actObjRef1;
    this.oldActObjRef2 = actObjRef2;
    this.oldTextRef = TextRef;

    this.canvas.add(actObjRef1);
    this.canvas.add(actObjRef2);
    this.canvas.add(TextRef);

    this.canvas.renderAll();
  }
  private drawTriangle(pc: PcInterface) {
    const x = pc.img_x;
    const y = pc.img_y;

    if (this.oldTriangle !== null && this.oldTriangle !== undefined) {
      this.canvas.remove(this.oldTriangle);
      this.canvas.remove(this.oldTextTriangle);
    }
    const squareBase = 12;
    const triangle = new fabric.Triangle({
      width: squareBase,
      height: squareBase,
      fill: "red",
      stroke: "black",
      left: Math.round(x - squareBase / 2),
      top: y, // si no ponemos este 2, entonces no lee bien debajo del triangulo
      selectable: false,
      ref: "triangle",
      hoverCursor: "default"
    });

    const textTriangle = new fabric.Text(
      " + ".concat(pc.gradienteNormalizado.toString().concat(" ºC ")),
      {
        left: pc.img_left,
        top: pc.img_top + pc.img_height + 5,
        fontSize: 13,
        textBackgroundColor: "white",
        ref: "text",
        selectable: false,
        hoverCursor: "default",
        fill: "red"
      }
    );

    this.oldTriangle = triangle;
    this.oldTextTriangle = textTriangle;

    this.canvas.add(triangle);
    this.canvas.add(textTriangle);
    this.canvas.renderAll();
  }

  onMouseLeaveCanvas($event) {
    // this.tooltipElement.style.display = 'none';
  }

  onMouseMoveCanvas($event: MouseEvent) {
    // Temperatura puntual
    // const mousePositionData = this.hiddenCanvas
    //   .getContext("2d")
    //   .getImageData($event.offsetX, $event.offsetY, 1, 1).data;
    // this.tooltipTemp = this.rgb2temp(
    //   mousePositionData[0],
    //   mousePositionData[1],
    //   mousePositionData[2]
    // );
    // this.tooltipElement.style.display = "block";
    // this.tooltipElement.style.left = $event.layerX + "px";
    // this.tooltipElement.style.top = $event.layerY + "px";
  }

  rgb2temp(red: number, green: number, blue: number) {
    // a = (max_temp - min_temp) / 255
    // b= min_temp

    const b = this.minTemp;
    const a = (this.maxTemp - this.minTemp) / 255;

    const x = (red + green + blue) / 3;
    return Math.round((x * a + b) * 10) / 10;
  }

  downloadRjpg(pc: PcInterface) {
    this.storage
      .ref(`informes/${this.pc.informeId}/rjpg/${pc.archivoPublico}`)
      .getDownloadURL()
      .subscribe(downloadUrl => {
        this.pc.downloadUrlStringRjpg = downloadUrl;
        const xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.onload = event => {
          /* Create a new Blob object using the response
           *  data of the onload object.
           */
          const blob = new Blob([xhr.response], { type: "image/jpg" });
          const a: any = document.createElement("a");
          a.style = "display: none";
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = `radiometrico_${pc.archivoPublico}`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open("GET", downloadUrl);
        xhr.send();
      });
  }

  downloadJpgVisual(pc: PcInterface) {
    this.storage
      .ref(`informes/${this.pc.informeId}/jpgVisual/${pc.archivoPublico}`)
      .getDownloadURL()
      .subscribe(downloadUrl => {
        this.pc.downloadUrlStringVisual = downloadUrl;
        const xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.onload = event => {
          /* Create a new Blob object using the response
           *  data of the onload object.
           */
          const blob = new Blob([xhr.response], { type: "image/jpg" });
          const a: any = document.createElement("a");
          a.style = "display: none";
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = `visual_${pc.archivoPublico}`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open("GET", downloadUrl);
        xhr.send();
      });
  }

  downloadJpg(pc: PcInterface) {
    this.storage
      .ref(`informes/${this.pc.informeId}/jpg/${pc.archivoPublico}`)
      .getDownloadURL()
      .subscribe(downloadUrl => {
        this.pc.downloadUrlString = downloadUrl;
        const xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.onload = event => {
          /* Create a new Blob object using the response
           *  data of the onload object.
           */
          const blob = new Blob([xhr.response], { type: "image/jpg" });
          const a: any = document.createElement("a");
          a.style = "display: none";
          document.body.appendChild(a);
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = `jpg_${pc.archivoPublico}`;
          a.click();
          window.URL.revokeObjectURL(url);
        };
        xhr.open("GET", downloadUrl);
        xhr.send();
      });
  }

  setEventListenersCanvas() {
    this.canvas.on("mouse:over", e => {
      if (e.target !== null) {
        if (
          e.target.ref !== "triangle" &&
          e.target.ref !== "text" &&
          e.target.ref !== true
        ) {
          e.target.set("fill", "rgba(255,255,255,0.3)"),
            this.canvas.renderAll();
        }
      }
    });

    this.canvas.on("mouse:out", e => {
      if (e.target !== null) {
        if (
          e.target.ref !== "triangle" &&
          e.target.ref !== "text" &&
          e.target.ref !== true
        ) {
          e.target.set("fill", "rgba(255,255,255,0)"), this.canvas.renderAll();
        }
      }
    });

    this.canvas.on("selection:updated", e => {
      const actObj = e.selected[0];
      const selectedPc = this.allPcs.filter((pc, i, a) => {
        return pc.local_id === actObj.localId;
      });
      this.selectPc(selectedPc[0]);
    });

    this.canvas.on("selection:created", e => {
      const actObj = e.selected[0];
      const selectedPc = this.allPcs.filter((pc, i, a) => {
        return pc.local_id === actObj.localId;
      });
      this.selectPc(selectedPc[0]);
    });

    const zoom = document.getElementById("visual-zoom") as HTMLCanvasElement;
    const zoomCtx = zoom.getContext("2d");

    this.canvas.on("mouse:move", e => {
      zoomCtx.fillStyle = "white";
      //zoomCtx.clearRect(0,0, zoom.width, zoom.height);
      //zoomCtx.fillStyle = "transparent";
      zoomCtx.fillRect(0, 0, zoom.width, zoom.height);
      // const visualCanvas = document.getElementById(
      //   "visual-canvas"
      // ) as HTMLCanvasElement;
      const scaleX = this.imagenTermica.width / this.canvas.width;
      const scaleY = this.imagenTermica.height / this.canvas.height;

      const zoomFactor = 2;

      zoomCtx.drawImage(
        this.imagenTermica,
        e.pointer.x * scaleX - this.zoomSquare / 2 / zoomFactor,
        e.pointer.y * scaleY - this.zoomSquare / 2 / zoomFactor,
        this.zoomSquare,
        this.zoomSquare,
        0,
        0,
        this.zoomSquare * zoomFactor,
        this.zoomSquare * zoomFactor
      );
      // console.log(zoom.style);
      zoom.style.top = e.pointer.y - this.zoomSquare / 2 + "px";
      zoom.style.left = e.pointer.x + 20 + "px";
      zoom.style.display = "block";
    });

    this.canvas.on("mouse:out", e => {
      zoom.style.display = "none";
    });

    this.visualCanvas.on("mouse:move", e => {
      zoomCtx.fillStyle = "white";
      //zoomCtx.clearRect(0,0, zoom.width, zoom.height);
      //zoomCtx.fillStyle = "transparent";
      zoomCtx.fillRect(0, 0, zoom.width, zoom.height);
      // const visualCanvas = document.getElementById(
      //   "visual-canvas"
      // ) as HTMLCanvasElement;
      const scaleX = this.imagenVisual.width / this.visualCanvas.width;
      const scaleY = this.imagenVisual.height / this.visualCanvas.height;
      zoomCtx.drawImage(
        this.imagenVisual,
        e.pointer.x * scaleX - this.zoomSquare / 2,
        e.pointer.y * scaleY - this.zoomSquare / 2,
        this.zoomSquare,
        this.zoomSquare,
        0,
        0,
        this.zoomSquare,
        this.zoomSquare
      );
      // console.log(zoom.style);
      zoom.style.top = e.pointer.y + 10 + "px";
      zoom.style.left = e.pointer.x + 20 + "px";
      zoom.style.display = "block";
    });

    this.visualCanvas.on("mouse:out", e => {
      zoom.style.display = "none";
    });
  }

  onSliderChange($event) {
    // $event = false: termico | True: visual
    if ($event) {
      // Visual
      document.getElementById("imagen-div").style.display = "none";
      document.getElementById("imagen-visual-div").style.display = "block";
    } else {
      document.getElementById("imagen-div").style.display = "block";
      document.getElementById("imagen-visual-div").style.display = "none";
    }
  }

  checkIsNaN(item: any) {
    return Number.isNaN(item);
  }

  checkIsMoreThanOne(item: any) {
    if (Number.isNaN(item) || typeof item === "string") {
      return false;
    }
    return item > 1;
  }

  checkHasModule(pc: PcInterface) {
    if (pc.modulo && pc.modulo !== undefined) {
      return pc.modulo.hasOwnProperty("potencia");
    }
    return false;
  }

  getEtiquetaLocalX(pc: PcInterface) {
    return this.plantaService.getEtiquetaLocalX(this.planta, pc);
  }
  getEtiquetaLocalY(pc: PcInterface) {
    return this.plantaService.getEtiquetaLocalY(this.planta, pc);
  }
  updatePcInDb(pc: PcInterface) {
    delete pc.downloadUrlVisual$;
    delete pc.downloadUrl$;
    delete pc.downloadUrlRjpg$;
    this.pcService.updatePc(pc);
  }
}
