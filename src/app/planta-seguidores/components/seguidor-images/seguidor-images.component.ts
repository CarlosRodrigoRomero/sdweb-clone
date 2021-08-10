import { Component, OnDestroy, OnInit } from '@angular/core';

import { combineLatest, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import 'fabric';
declare let fabric;

import { SeguidoresControlService } from '../../services/seguidores-control.service';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { SeguidorService } from '@core/services/seguidor.service';

import { PcInterface } from '@core/models/pc';
import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-seguidor-images',
  templateUrl: './seguidor-images.component.html',
  styleUrls: ['./seguidor-images.component.css'],
})
export class SeguidorImagesComponent implements OnInit, OnDestroy {
  private seguidorSelected: Seguidor;
  private imageVisual = new Image();
  private imageThermal = new Image();

  anomaliaSelected: Anomalia = undefined;
  prevAnomaliaSelected: Anomalia = undefined;
  imageSelected = 0;
  imagesLoaded: boolean;
  zoomSquare = 200;
  viewSelected = 0;

  imageSeguidor;
  visualCanvas;
  thermalCanvas;
  anomsCanvas;
  canvas: any;
  sw = 2;
  c = [];
  strokeColor = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private mapSeguidoresService: MapSeguidoresService,
    private seguidorViewService: SeguidorViewService,
    private seguidorService: SeguidorService
  ) {}

  ngOnInit(): void {
    // nos suscribimos a la carga de la imagen
    this.subscriptions.add(this.seguidorViewService.imageLoaded$.subscribe((loaded) => (this.imagesLoaded = loaded)));

    this.visualCanvas = new fabric.Canvas('visual-canvas');
    this.seguidorViewService.visualCanvas = this.visualCanvas;
    this.thermalCanvas = new fabric.Canvas('thermal-canvas');
    this.seguidorViewService.thermalCanvas = this.thermalCanvas;
    this.anomsCanvas = new fabric.Canvas('anomalias-canvas');
    this.setEventListenersCanvas();

    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$
        .pipe(
          switchMap((seguidor) => {
            this.seguidorSelected = seguidor;

            // obtenemos imagen térmica
            this.seguidoresControlService.getImageSeguidor('jpg');
            // obtenemos imagen visual
            this.seguidoresControlService.getImageSeguidor('jpgVisual');

            return this.mapSeguidoresService.toggleViewSelected$;
          }),
          switchMap((view) => {
            this.viewSelected = view;

            if (this.seguidorSelected !== undefined) {
              this.drawAnomalias();
            }

            return combineLatest([
              this.seguidorViewService.anomaliaSelected$,
              this.seguidorViewService.prevAnomaliaSelected$,
            ]);
          }),
          switchMap(([anomSel, prevAnomSel]) => {
            this.anomaliaSelected = anomSel;
            this.prevAnomaliaSelected = prevAnomSel;

            if (this.seguidorSelected !== undefined) {
              if (this.anomaliaSelected !== undefined) {
                this.setAnomaliaStyle(this.anomaliaSelected, true);
              }

              if (this.prevAnomaliaSelected !== undefined) {
                this.setAnomaliaStyle(this.prevAnomaliaSelected, false);
              }
            }

            this.anomsCanvas.renderAll();

            return combineLatest([
              this.seguidoresControlService.urlVisualImageSeguidor$,
              this.seguidoresControlService.urlThermalImageSeguidor$,
              this.seguidorViewService.imageSelected$,
            ]);
          })
        )
        .subscribe(([urlVisual, urlThermal, image]) => {
          this.imageSelected = Number(image);

          if (this.imageSelected === 0) {
            // mostramos imagen termica
            document.getElementById('thermal-canvas').style.visibility = 'visible';

            if (this.seguidorSelected !== undefined) {
              // creamos las anomalias de nuevo al volver a la vista termica
              if (this.anomsCanvas !== undefined && this.anomsCanvas.isEmpty()) {
                this.drawAnomalias();
              }
            }
          } else {
            // ocultamos imagen termica
            document.getElementById('thermal-canvas').style.visibility = 'hidden';

            // quitamos las anomalias al seleccionar la vista visual
            if (this.anomsCanvas !== undefined) {
              this.anomsCanvas.clear();
            }
          }

          this.imageThermal.src = urlThermal;

          this.imageThermal.onload = () => {
            this.seguidorViewService.imagesLoaded = true;

            this.thermalCanvas.setBackgroundImage(
              new fabric.Image(this.imageThermal, {
                left: 0,
                top: 0,
                angle: 0,
                opacity: 1,
                draggable: false,
                lockMovementX: true,
                lockMovementY: true,
                scaleX: this.thermalCanvas.width / this.imageThermal.width,
                scaleY: this.thermalCanvas.height / this.imageThermal.height,
              }),
              this.thermalCanvas.renderAll.bind(this.thermalCanvas)
            );
          };

          this.imageVisual.src = urlVisual;

          this.imageVisual.onload = () => {
            this.visualCanvas.setBackgroundImage(
              new fabric.Image(this.imageVisual, {
                left: 0,
                top: 0,
                angle: 0,
                opacity: 1,
                draggable: false,
                lockMovementX: true,
                lockMovementY: true,
                scaleX: this.visualCanvas.width / this.imageVisual.width,
                scaleY: this.visualCanvas.height / this.imageVisual.height,
              }),
              this.visualCanvas.renderAll.bind(this.visualCanvas)
            );
          };
        })
    );
  }

  drawAnomalias() {
    this.anomsCanvas.clear();

    // tslint:disable-next-line: triple-equals
    if (this.viewSelected == 1) {
      // en el view Cels. Calientes solo mostramos estas
      this.seguidorSelected.anomaliasCliente
        .filter((anom) => anom.tipo === 8 || anom.tipo === 9)
        .forEach((anom) => this.drawAnomalia(anom));
    } else {
      this.seguidorSelected.anomaliasCliente.forEach((anom) => this.drawAnomalia(anom));
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

    /* const textId = new fabric.Text('#'.concat(pc.local_id.toString().concat(' ')), {
      left: pc.img_left,
      top: pc.img_top - 26,
      fontSize: 18,
      // textBackgroundColor: 'red',
      ref: 'text',
      selectable: false,
      hoverCursor: 'default',
      fill: 'white',
    }); */

    this.anomsCanvas.add(polygon);
    // this.anomsCanvas.add(textId);
    this.anomsCanvas.renderAll();
  }

  private getAnomaliaColor(anomalia: Anomalia): string {
    // tslint:disable-next-line: triple-equals
    if (this.viewSelected == 0) {
      return this.seguidorService.getPerdidasColor(anomalia);
      // tslint:disable-next-line: triple-equals
    } else if (this.viewSelected == 1) {
      return this.seguidorService.getCelsCalientesColor(anomalia);
    } else {
      return this.seguidorService.getGradienteColor(anomalia);
    }
  }

  setEventListenersCanvas() {
    this.anomsCanvas.on('mouse:over', (e) => {
      if (e.target !== null) {
        if (e.target.ref === 'anom') {
          if (this.anomaliaSelected !== e.target.anomalia) {
            e.target.set({ stroke: 'white', strokeWidth: 2 }), this.anomsCanvas.renderAll();
          }
        }
      }
    });

    this.anomsCanvas.on('mouse:out', (e) => {
      if (e.target !== null) {
        if (e.target.ref === 'anom') {
          if (this.anomaliaSelected !== e.target.anomalia) {
            e.target.set({ stroke: this.getAnomaliaColor(e.target.anomalia), strokeWidth: 2 }),
              this.anomsCanvas.renderAll();
          }
        }
      }
    });

    this.anomsCanvas.on('mouse:down', (e) => {
      if (e.target !== null) {
        if (e.target.ref === 'anom') {
          // seleccionamos la anterior como previa
          this.seguidorViewService.prevAnomaliaSelected = this.anomaliaSelected;

          // seleccionamos la nueva
          const anomaliaSelected = this.seguidorSelected.anomaliasCliente.find((anom) => anom.id === e.target.anomId);

          this.seguidorViewService.anomaliaSelected = anomaliaSelected;

          // e.target.set({ stroke: 'white', strokeWidth: 4 });
        } else {
          this.seguidorViewService.anomaliaSelected = undefined;
        }
      }
    });

    const zoom = document.getElementById('visual-zoom') as HTMLCanvasElement;
    const zoomCtx = zoom.getContext('2d');

    this.anomsCanvas.on('mouse:move', (e) => {
      zoomCtx.fillStyle = 'white';
      zoomCtx.fillRect(0, 0, zoom.width, zoom.height);

      let image;
      if (this.imageSelected === 0) {
        image = this.imageThermal;
      } else {
        image = this.imageVisual;
      }
      const scaleX = image.width / this.anomsCanvas.width;
      const scaleY = image.height / this.anomsCanvas.height;

      const zoomFactor = 2;

      zoomCtx.drawImage(
        image,
        e.pointer.x * scaleX - this.zoomSquare / 2 / zoomFactor,
        e.pointer.y * scaleY - this.zoomSquare / 2 / zoomFactor,
        this.zoomSquare,
        this.zoomSquare,
        0,
        0,
        this.zoomSquare * zoomFactor,
        this.zoomSquare * zoomFactor
      );

      zoom.style.top = e.pointer.y - this.zoomSquare / 2 + 'px';
      zoom.style.left = e.pointer.x + 20 + 'px';
      zoom.style.display = 'block';
    });

    this.anomsCanvas.on('mouse:out', (e) => {
      zoom.style.display = 'none';
    });
  }

  private setAnomaliaStyle(anomalia: Anomalia, selected: boolean) {
    const polygon = this.anomsCanvas.getObjects().find((anom) => anom.anomId === anomalia.id);

    if (polygon !== undefined) {
      if (selected) {
        polygon.set({ stroke: 'white', strokeWidth: 4 });
      } else {
        polygon.set({ stroke: this.getAnomaliaColor(anomalia), strokeWidth: 2 });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
