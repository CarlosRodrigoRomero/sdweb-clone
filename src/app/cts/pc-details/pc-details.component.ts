import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChange,
  SimpleChanges
} from "@angular/core";
import { PcInterface } from "../../models/pc";
import { InformeInterface } from "../../models/informe";
import { GLOBAL } from "src/app/services/global";
import { AngularFireStorage } from "@angular/fire/storage";
import "fabric";
import { MatDialog } from "@angular/material";
import { PcDetailsDialogComponent } from "../pc-details-dialog/pc-details-dialog.component";
import { PcService } from "src/app/services/pc.service";
declare let fabric;

export interface DialogData {
  pc: PcInterface;
  allPcs: PcInterface[];
}

@Component({
  selector: "app-pc-details",
  templateUrl: "./pc-details.component.html",
  styleUrls: ["./pc-details.component.css"]
})
export class PcDetailsComponent implements OnInit, OnChanges {
  @Input() pc: PcInterface;
  @Input() selectedPc: PcInterface;
  @Input() allPcs: PcInterface[];
  @Input() informe: InformeInterface;

  public tooltipTemp: number;
  private maxTemp: number;
  private minTemp: number;
  public canvasWidth: number;
  public canvasHeight: number;
  private fResize: number;
  private canvas: any;
  private tooltipElement: any;
  public pcDescripcion: string[];
  public pcCausa: string[];
  public pcRecomendacion: string[];
  public pcPerdidas: string[];

  constructor(
    private storage: AngularFireStorage,
    public dialog: MatDialog,
    public pcservice: PcService
  ) {}

  ngOnInit() {
    if (!this.pc.downloadUrl$) {
      this.pc.downloadUrl$ = this.storage
        .ref(`informes/${this.informe.id}/jpg/${this.pc.archivoPublico}`)
        .getDownloadURL();
      this.pc.downloadUrl$.subscribe(url => {
        this.pc.downloadUrlString = url;
      });
    }
    this.minTemp = this.pc.rangeMin;
    this.maxTemp = this.pc.rangeMax;

    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.pcCausa = GLOBAL.pcCausa;
    this.pcRecomendacion = GLOBAL.pcRecomendacion;
    this.pcPerdidas = GLOBAL.pcPerdidas;
    this.canvasWidth = 360;
    this.canvasHeight = 256;
    this.fResize = this.canvasWidth / GLOBAL.resolucionCamara[1];
  }

  ngOnChanges() {
    if (this.selectedPc === this.pc) {
      this.canvas = new fabric.Canvas(this.pc.id);
      const imagenTermica = new Image();

      imagenTermica.crossOrigin = "anonymous";
      imagenTermica.src = this.pc.downloadUrlString;

      imagenTermica.onload = () => {
        // pica.resize(imagenTermica, this.canvas).then();
        const imagenTermicaCanvas = new fabric.Image(imagenTermica, {
          left: 0,
          top: 0,
          angle: 0,
          opacity: 1,
          draggable: false,
          lockMovementX: true,
          lockMovementY: true,
          selectable: false,
          hoverCursor: "default"
        });
        imagenTermicaCanvas.scaleToHeight(this.canvasHeight);
        imagenTermicaCanvas.scaleToWidth(this.canvasWidth);
        this.canvas.add(imagenTermicaCanvas);
        this.drawPc(this.selectedPc, this.fResize);
        this.drawTriangle(this.selectedPc, this.fResize);

        // this.canvas.getContext('2d').drawImage(imagenTermica, 0, 0 );
        // this.tooltipElement = document.getElementById(`tooltip_${this.pc.id}`);
        // console.log('this.tooltipElement', this.tooltipElement);
      };
    }
  }
  downloadReclamacion() {
    console.log("reclamacion");
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
  onMouseLeaveCanvas($event) {
    this.tooltipElement.style.display = "none";
  }

  onMouseMoveCanvas($event: MouseEvent) {
    // Temperatura puntual
    const mousePositionData = this.canvas
      .getContext("2d")
      .getImageData($event.offsetX, $event.offsetY, 1, 1).data;

    this.tooltipTemp = this.rgb2temp(
      mousePositionData[0],
      mousePositionData[1],
      mousePositionData[2]
    );

    this.tooltipElement.style.display = "block";
    this.tooltipElement.style.left = $event.layerX + "px";
    this.tooltipElement.style.top = $event.layerY + "px";
  }

  rgb2temp(red: number, green: number, blue: number) {
    // a = (max_temp - min_temp) / 255
    // b= min_temp

    const b = this.minTemp;
    const a = (this.maxTemp - this.minTemp) / 255;

    const x = (red + green + blue) / 3;
    return Math.round((x * a + b) * 10) / 10;
  }

  drawPc(pc: PcInterface, factor = 1) {
    const actObj1 = new fabric.Rect({
      left: pc.img_left * factor,
      top: pc.img_top * factor,
      fill: "rgba(0,0,0,0)",
      stroke: "black",
      strokeWidth: 1,
      width: pc.img_width * factor,
      height: pc.img_height * factor,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      selectable: false,
      hoverCursor: "default"
    });
    const actObj2 = new fabric.Rect({
      left: (pc.img_left - 1) * factor,
      top: (pc.img_top - 1) * factor,
      fill: "rgba(0,0,0,0)",
      stroke: "red",
      strokeWidth: 1,
      width: (pc.img_width + 2) * factor,
      height: (pc.img_height + 2) * factor,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      hoverCursor: "default",
      selectable: true
    });

    this.canvas.add(actObj1);
    this.canvas.add(actObj2);
    this.canvas.renderAll();
  }

  private drawTriangle(pc: PcInterface, factor = 1) {
    const x = pc.img_x * factor;
    const y = pc.img_y * factor;

    const squareBase = 12 * factor;
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
        left: pc.img_left * factor,
        top: (pc.img_top + pc.img_height + 5) * factor,
        fontSize: 22 * factor,
        textBackgroundColor: "white",
        ref: "text",
        selectable: false,
        hoverCursor: "default",
        fill: "red"
      }
    );

    this.canvas.add(triangle);
    this.canvas.add(textTriangle);
    this.canvas.renderAll();
  }

  onClickVerDetalles(selectedPc: PcInterface): void {
    // selectedPc.downloadUrlRjpg$ = this.storage.ref(`informes/${this.informeId}/rjpg/${selectedPc.archivoPublico}`).getDownloadURL();
    if (!selectedPc.downloadUrl$) {
      selectedPc.downloadUrl$ = this.storage
        .ref(`informes/${this.informe.id}/jpg/${selectedPc.archivoPublico}`)
        .getDownloadURL();
    }
    if (!selectedPc.downloadUrlVisual$) {
      selectedPc.downloadUrlVisual$ = this.storage
        .ref(
          `informes/${this.informe.id}/jpgVisual/${selectedPc.archivoPublico}`
        )
        .getDownloadURL();
    }
    const dialogRef = this.dialog.open(PcDetailsDialogComponent, {
      width: "1100px",
      // height: '600px',
      hasBackdrop: true,
      data: { pc: selectedPc, allPcs: this.allPcs }
    });

    dialogRef.afterClosed().subscribe(result => {});
  }
}
