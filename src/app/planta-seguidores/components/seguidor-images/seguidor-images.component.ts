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
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-seguidor-images',
  templateUrl: './seguidor-images.component.html',
  styleUrls: ['./seguidor-images.component.css'],
})
export class SeguidorImagesComponent implements OnInit {
  private seguidorSelected: Seguidor;
  private imageSelected = new Image();
  anomaliaSelected: Anomalia = undefined;
  thermalImage = new Image();
  imageLoaded: boolean;
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

    this.seguidoresControlService.seguidorSelected$
      .pipe(
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
          this.drawAnomalias();
        }
      });

    combineLatest([
      this.seguidoresControlService.urlVisualImageSeguidor$,
      this.seguidoresControlService.urlThermalImageSeguidor$,
      this.seguidorViewService.imageSelected$,
    ]).subscribe(([urlVis, urlTherm, image]) => {
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

    this.seguidorViewService.anomaliaSelected$.subscribe((anomSel) => (this.anomaliaSelected = anomSel));
  }

  drawAnomalias() {
    this.anomsCanvas.clear();

    // tslint:disable-next-line: triple-equals
    if (this.viewSelected == 1) {
      // en el view Cels. Calientes solo mostramos estas
      this.seguidorSelected.anomalias
        .filter((anom) => anom.tipo === 8 || anom.tipo === 9)
        .forEach((anom) => this.drawAnomalia(anom));
    } else {
      this.seguidorSelected.anomalias.forEach((anom) => this.drawAnomalia(anom));
    }
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
      anomId: anomalia.id,
      ref: 'anom',
      selectable: false,
      hoverCursor: 'pointer',
      rx: 4,
      ry: 4,
      anomalia,
    });

    const textId = new fabric.Text('#'.concat(pc.local_id.toString().concat(' ')), {
      left: pc.img_left,
      top: pc.img_top - 26,
      fontSize: 18,
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
      return this.anomaliaService.getCelsCalientesColor(anomalia);
    } else {
      return this.anomaliaService.getGradienteColor(this.seguidorSelected.anomalias, anomalia);
    }
  }

  setEventListenersCanvas() {
    this.anomsCanvas.on('mouse:over', (e) => {
      if (e.target !== null) {
        if (e.target.ref === 'anom') {
          if (this.anomaliaSelected !== e.target.anomalia) {
            e.target.set('stroke', 'white'), this.anomsCanvas.renderAll();
          }
        }
      }
    });

    this.anomsCanvas.on('mouse:out', (e) => {
      if (e.target !== null) {
        if (e.target.ref === 'anom') {
          if (this.anomaliaSelected !== e.target.anomalia) {
            e.target.set('stroke', this.getAnomaliaColor(e.target.anomalia)), this.anomsCanvas.renderAll();
          }
        }
      }
    });

    this.anomsCanvas.on('mouse:down', (e) => {
      if (e.target !== null) {
        if (e.target.ref === 'anom') {
          const anomaliaSelected = this.seguidorSelected.anomalias.find((anom) => anom.id === e.target.anomId);

          this.seguidorViewService.anomaliaSelected = anomaliaSelected;

          e.target.set({ stroke: 'white', strokeWidth: 4 });
        } else {
          this.seguidorViewService.anomaliaSelected = undefined;
        }
      }
    });

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
      const scaleX = this.imageSelected.width / this.anomsCanvas.width;
      const scaleY = this.imageSelected.height / this.anomsCanvas.height;

      const zoomFactor = 2;

      zoomCtx.drawImage(
        this.imageSelected,
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

    /* this.anomsCanvas.on('mouse:move', (e) => {
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
    });*/
  }

  private selectAnomalia(anomalia: Anomalia) {
    // this.drawObjRef(anomalia);
    // this.drawTriangle(anomalia);
    this.seguidorViewService.anomaliaSelected = anomalia;
  }
}