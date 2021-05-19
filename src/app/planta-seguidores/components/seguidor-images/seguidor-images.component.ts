import { Component, OnInit } from '@angular/core';

import { combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import 'fabric';
declare let fabric;

import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { ReportControlService } from '@core/services/report-control.service';

import { PcInterface } from '@core/models/pc';
import { Seguidor } from '@core/models/seguidor';
import { GLOBAL } from '@core/services/global';
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-seguidor-images',
  templateUrl: './seguidor-images.component.html',
  styleUrls: ['./seguidor-images.component.css'],
})
export class SeguidorImagesComponent implements OnInit {
  private urlVisualImageSeguidor: string;
  private urlThermalImageSeguidor: string;
  private selectedInformeId: string;
  private seguidorSelected: Seguidor;
  private imageSelected = new Image();
  thermalImage = new Image();
  imageLoaded: boolean;
  visualImage = new Image();
  visualImageLoaded: boolean;
  zoomSquare = 200;
  visualCanvas: any;
  viewSelected = 0;

  imageSeguidor;
  imageCanvas;
  anomsCanvas;
  canvas: any;
  sw = 2;
  c = [];
  strokeColor = 0;
  drawAnomalias;

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private mapSeguidoresService: MapSeguidoresService,
    private anomaliaService: AnomaliaService,
    private seguidorViewService: SeguidorViewService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.imageCanvas = new fabric.Canvas('image-canvas');
    this.anomsCanvas = new fabric.Canvas('anomalias-canvas');
    this.setEventListenersCanvas();

    this.reportControlService.selectedInformeId$
      .pipe(
        switchMap((informeId) => {
          this.selectedInformeId = informeId;

          return this.seguidoresControlService.seguidorSelected$;
        }),
        switchMap((seguidor) => {
          this.seguidorSelected = seguidor;

          // obtenemos imagen térmica
          this.seguidoresControlService.getImageSeguidor('jpg');
          // obtenemos imagen visual
          this.seguidoresControlService.getImageSeguidor('jpgVisual');

          return this.mapSeguidoresService.toggleViewSelected$;
        })
      )
      .subscribe((view) => {
        this.viewSelected = view;

        if (this.seguidorSelected !== undefined) {
          this.drawAllAnomalias();
        }
      });

    combineLatest([
      this.seguidoresControlService.urlVisualImageSeguidor$,
      this.seguidoresControlService.urlThermalImageSeguidor$,
      this.seguidorViewService.imageSelected$,
    ]).subscribe(([urlVis, urlTherm, image]) => {
      this.urlVisualImageSeguidor = urlVis;
      this.urlThermalImageSeguidor = urlTherm;

      // tslint:disable-next-line: triple-equals
      if (image == 0) {
        this.imageSelected.src = urlTherm;
      } else {
        this.imageSelected.src = urlVis;
      }

      this.imageSelected.onload = () => {
        this.imageLoaded = true;

        this.imageCanvas.setBackgroundImage(
          new fabric.Image(this.imageSelected, {
            left: 0,
            top: 0,
            angle: 0,
            opacity: 1,
            draggable: false,
            lockMovementX: true,
            lockMovementY: true,
            scaleX: this.imageCanvas.width / this.imageSelected.width,
            scaleY: this.imageCanvas.height / this.imageSelected.height,
          }),
          this.imageCanvas.renderAll.bind(this.imageCanvas)
        );
      };
    });
  }

  drawAllAnomalias() {
    this.anomsCanvas.clear();
    this.seguidorSelected.anomalias.forEach((anom) => this.drawAnomalia(anom));
  }

  drawAnomalia(anomalia: Anomalia) {
    const pc = anomalia as PcInterface;

    const polygon = new fabric.Rect({
      left: pc.img_left,
      top: pc.img_top,
      fill: 'rgba(0,0,0,0)',
      stroke: this.getAnomaliaColor(anomalia),
      strokeWidth: 2,
      width: pc.img_width,
      height: pc.img_height,
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      localId: pc.local_id,
      ref: false,
      selectable: false,
      hoverCursor: 'default',
      rx: 4,
      ry: 4,
    });

    const textId = new fabric.Text('#'.concat(pc.local_id.toString().concat(' ')), {
      left: pc.img_left,
      top: pc.img_top - 26,
      fontSize: 20,
      // textBackgroundColor: 'red',
      ref: 'text',
      selectable: false,
      hoverCursor: 'default',
      fill: 'white',
    });

    this.anomsCanvas.add(polygon);
    this.anomsCanvas.add(textId);
    this.anomsCanvas.renderAll();
  }

  private getAnomaliaColor(anomalia: Anomalia): string {
    // tslint:disable-next-line: triple-equals
    if (this.viewSelected == 0) {
      return this.anomaliaService.getPerdidasColor(this.seguidorSelected.anomalias, anomalia);
      // tslint:disable-next-line: triple-equals
    } else if (this.viewSelected == 1) {
      return 'white';
    } else {
      return 'black';
    }
  }

  private getPerdidasColor(anomalia: Anomalia) {
    return 'white';
  }

  setEventListenersCanvas() {
    this.anomsCanvas.on('mouse:over', (e) => {
      if (e.target !== null) {
        if (e.target.ref !== 'triangle' && e.target.ref !== 'text' && e.target.ref !== true) {
          e.target.set('fill', 'rgba(255,255,255,0.3)'), this.anomsCanvas.renderAll();
        }
      }
    });

    this.anomsCanvas.on('mouse:out', (e) => {
      if (e.target !== null) {
        if (e.target.ref !== 'triangle' && e.target.ref !== 'text' && e.target.ref !== true) {
          e.target.set('fill', 'rgba(255,255,255,0)'), this.anomsCanvas.renderAll();
        }
      }
    });

    /*   this.canvas.on('selection:updated', (e) => {
      const actObj = e.selected[0];
      const selectedPc = this.allPcs.filter((pc, i, a) => {
        return pc.local_id === actObj.localId;
      });
      this.selectPc(selectedPc[0]);
    });

    this.canvas.on('selection:created', (e) => {
      const actObj = e.selected[0];
      const selectedPc = this.allPcs.filter((pc, i, a) => {
        return pc.local_id === actObj.localId;
      });
      this.selectPc(selectedPc[0]);
    }); */

    const zoom = document.getElementById('visual-zoom') as HTMLCanvasElement;
    const zoomCtx = zoom.getContext('2d');

    this.anomsCanvas.on('mouse:move', (e) => {
      zoomCtx.fillStyle = 'white';
      // zoomCtx.clearRect(0,0, zoom.width, zoom.height);
      // zoomCtx.fillStyle = "transparent";
      zoomCtx.fillRect(0, 0, zoom.width, zoom.height);
      // const visualCanvas = document.getElementById(
      //   "visual-canvas"
      // ) as HTMLCanvasElement;
      const scaleX = this.thermalImage.width / this.anomsCanvas.width;
      const scaleY = this.thermalImage.height / this.anomsCanvas.height;

      const zoomFactor = 2;

      zoomCtx.drawImage(
        this.thermalImage,
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
      zoom.style.top = e.pointer.y - this.zoomSquare / 2 + 'px';
      zoom.style.left = e.pointer.x + 20 + 'px';
      zoom.style.display = 'block';
    });

    this.anomsCanvas.on('mouse:out', (e) => {
      zoom.style.display = 'none';
    });

    this.anomsCanvas.on('mouse:move', (e) => {
      zoomCtx.fillStyle = 'white';
      // zoomCtx.clearRect(0,0, zoom.width, zoom.height);
      // zoomCtx.fillStyle = "transparent";
      zoomCtx.fillRect(0, 0, zoom.width, zoom.height);
      // const visualCanvas = document.getElementById(
      //   "visual-canvas"
      // ) as HTMLCanvasElement;
      const scaleX = this.thermalImage.width / this.anomsCanvas.width;
      const scaleY = this.thermalImage.height / this.anomsCanvas.height;
      zoomCtx.drawImage(
        this.thermalImage,
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
      zoom.style.top = e.pointer.y + 10 + 'px';
      zoom.style.left = e.pointer.x + 20 + 'px';
      zoom.style.display = 'block';
    });

    this.anomsCanvas.on('mouse:out', (e) => {
      zoom.style.display = 'none';
    });
  }
}
