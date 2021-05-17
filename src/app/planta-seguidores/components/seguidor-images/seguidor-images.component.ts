import { Component, OnInit } from '@angular/core';

import { combineLatest } from 'rxjs';

import p5 from 'p5';

import 'fabric';
declare let fabric;

import { SeguidoresControlService } from '../../services/seguidores-control.service';

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
  public urlImageSeguidor: string;
  private seguidorSelected: Seguidor;
  thermalImage = new Image();
  thermalImageLoaded: boolean;
  visualImageLoaded: boolean;
  zoomSquare = 200;
  visualCanvas: any;

  imageSeguidor;
  imageCanvas;
  anomsCanvas;
  canvas: any;
  sw = 2;
  c = [];
  strokeColor = 0;
  drawAnomalias;

  constructor(private seguidoresControlService: SeguidoresControlService) {}

  ngOnInit(): void {
    /* combineLatest([
      this.seguidoresControlService.seguidorSelected$,
      this.seguidoresControlService.urlImageVisualSeguidor$,
    ]).subscribe(([seguidor, url]) => {
      this.seguidorSelected = seguidor;
      this.urlImageSeguidor = url;

      if (this.seguidorSelected !== undefined) {
        const drawSeguidor = (d: p5) => {
          d.setup = () => {
            this.imageSeguidor = d.loadImage(this.urlImageSeguidor);

            this.imageCanvas = d.createCanvas(640, 512);
            this.imageCanvas.parent('canvas-anomalias');
          };

          d.draw = () => {
            d.background(this.imageSeguidor);
          };
        };

        this.canvas = new p5(drawSeguidor);
      }
    }); */

    this.canvas = new fabric.Canvas('dialog-canvas');
    this.visualCanvas = new fabric.Canvas('visual-canvas');
    this.setEventListenersCanvas();

    this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
      this.seguidorSelected = seguidor;

      /*  if (this.drawAnomalias === undefined) {
        this.drawAnomalias = (p: p5) => {
          p.setup = () => {
            this.anomsCanvas = p.createCanvas(640, 512);
            this.anomsCanvas.parent('canvas-anomalias');
          };

          p.draw = () => {
            if (this.seguidorSelected !== undefined) {
              // limpiamos las anomalias anteriores
              p.clear();
              // dibujamos las anomalias del seguidor
              this.seguidorSelected.anomalias.forEach((anomalia) => {
                p.noFill();
                p.strokeWeight(this.sw);

                if (anomalia.perdidas <= 0.01) {
                  p.stroke(GLOBAL.colores_mae[0]);
                } else if (anomalia.perdidas <= 0.02) {
                  p.stroke(GLOBAL.colores_mae[1]);
                } else {
                  p.stroke(GLOBAL.colores_mae[2]);
                }

                const pc = anomalia as PcInterface;

                p.rect(pc.img_left, pc.img_top, pc.img_width, pc.img_height, 4);

                p.point(pc.img_x, pc.img_y);
                // p.beginShape();
                // p.vertex(30, 20);
                // p.vertex(85, 20);
                // p.vertex(85, 75);
                // p.vertex(30, 75);
                // p.endShape(p.CLOSE);
              });
            }
          };
        };

        this.canvas = new p5(this.drawAnomalias);
      } */
    });

    this.seguidoresControlService.urlImageVisualSeguidor$.subscribe((url) => {
      this.urlImageSeguidor = url;

      this.thermalImage.src = url;

      this.thermalImage.onload = () => {
        this.thermalImageLoaded = true;

        this.drawAllAnomalias();

        this.canvas.setBackgroundImage(
          new fabric.Image(this.thermalImage, {
            left: 0,
            top: 0,
            angle: 0,
            opacity: 1,
            draggable: false,
            lockMovementX: true,
            lockMovementY: true,
          }),
          this.canvas.renderAll.bind(this.canvas),
          {
            // scaleX: this.canvas.width / image.width,
            // scaleY: this.canvas.height / image.height,
            crossOrigin: 'anonymous',
            left: 0,
            top: 0,
            // originX: 'top',
            // originY: 'left'
          }
        );
      };
    });
  }

  drawAllAnomalias() {
    this.canvas.clear();
    this.seguidorSelected.anomalias.forEach((anom) => this.drawAnomalia(anom));
  }

  drawAnomalia(anomalia: Anomalia) {
    const pc = anomalia as PcInterface;

    const polygon = new fabric.Rect({
      left: pc.img_left,
      top: pc.img_top,
      fill: 'rgba(0,0,0,0)',
      stroke: this.getPerdidasColor(anomalia),
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

    this.canvas.add(polygon);
    this.canvas.add(textId);
    this.canvas.renderAll();
  }

  private getPerdidasColor(anomalia: Anomalia) {
    if (anomalia.perdidas <= 0.01) {
      return GLOBAL.colores_mae[0];
    } else if (anomalia.perdidas <= 0.02) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  setEventListenersCanvas() {
    this.canvas.on('mouse:over', (e) => {
      if (e.target !== null) {
        if (e.target.ref !== 'triangle' && e.target.ref !== 'text' && e.target.ref !== true) {
          e.target.set('fill', 'rgba(255,255,255,0.3)'), this.canvas.renderAll();
        }
      }
    });

    this.canvas.on('mouse:out', (e) => {
      if (e.target !== null) {
        if (e.target.ref !== 'triangle' && e.target.ref !== 'text' && e.target.ref !== true) {
          e.target.set('fill', 'rgba(255,255,255,0)'), this.canvas.renderAll();
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

    this.canvas.on('mouse:move', (e) => {
      zoomCtx.fillStyle = 'white';
      // zoomCtx.clearRect(0,0, zoom.width, zoom.height);
      // zoomCtx.fillStyle = "transparent";
      zoomCtx.fillRect(0, 0, zoom.width, zoom.height);
      // const visualCanvas = document.getElementById(
      //   "visual-canvas"
      // ) as HTMLCanvasElement;
      const scaleX = this.thermalImage.width / this.canvas.width;
      const scaleY = this.thermalImage.height / this.canvas.height;

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

    this.canvas.on('mouse:out', (e) => {
      zoom.style.display = 'none';
    });

    this.visualCanvas.on('mouse:move', (e) => {
      zoomCtx.fillStyle = 'white';
      // zoomCtx.clearRect(0,0, zoom.width, zoom.height);
      // zoomCtx.fillStyle = "transparent";
      zoomCtx.fillRect(0, 0, zoom.width, zoom.height);
      // const visualCanvas = document.getElementById(
      //   "visual-canvas"
      // ) as HTMLCanvasElement;
      const scaleX = this.thermalImage.width / this.visualCanvas.width;
      const scaleY = this.thermalImage.height / this.visualCanvas.height;
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

    this.visualCanvas.on('mouse:out', (e) => {
      zoom.style.display = 'none';
    });
  }
}
