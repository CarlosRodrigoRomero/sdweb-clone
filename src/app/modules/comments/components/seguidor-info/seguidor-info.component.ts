import { Component, OnInit } from '@angular/core';

import { switchMap } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import 'fabric';
declare let fabric;

import { SeguidorViewCommentsService } from '@data/services/seguidor-view-comments.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';

import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-seguidor-info',
  templateUrl: './seguidor-info.component.html',
  styleUrls: ['./seguidor-info.component.css'],
})
export class SeguidorInfoComponent implements OnInit {
  private seguidorSelected: Seguidor;
  private imageVisual = new Image();
  private imageThermal = new Image();
  anomaliaSelected: Anomalia = undefined;
  prevAnomaliaSelected: Anomalia = undefined;
  imagesLoaded = false;
  imageSeguidor: any;
  visualCanvas: any;
  thermalCanvas: any;
  anomsCanvas: any;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidorViewCommentsService: SeguidorViewCommentsService,
    private comentariosControlService: ComentariosControlService
  ) {}

  ngOnInit(): void {
    // nos suscribimos a la carga de la imagen
    this.subscriptions.add(
      this.seguidorViewCommentsService.imagesLoaded$.subscribe((loaded) => (this.imagesLoaded = loaded))
    );

    // nos adaptamos al ancho  de la ventana
    this.seguidorViewCommentsService.setImagesWidthAndHeight();

    this.visualCanvas = new fabric.Canvas('visual-canvas');
    this.visualCanvas.setWidth(this.seguidorViewCommentsService.imagesWidth);
    this.visualCanvas.setHeight(this.seguidorViewCommentsService.imagesHeight);
    this.seguidorViewCommentsService.visualCanvas = this.visualCanvas;
    this.thermalCanvas = new fabric.Canvas('thermal-canvas');
    this.thermalCanvas.setWidth(this.seguidorViewCommentsService.imagesWidth);
    this.thermalCanvas.setHeight(this.seguidorViewCommentsService.imagesHeight);
    this.seguidorViewCommentsService.thermalCanvas = this.thermalCanvas;
    this.anomsCanvas = new fabric.Canvas('anomalias-canvas');
    this.anomsCanvas.setWidth(this.seguidorViewCommentsService.imagesWidth);
    this.anomsCanvas.setHeight(this.seguidorViewCommentsService.imagesHeight);
    this.seguidorViewCommentsService.anomsCanvas = this.anomsCanvas;
    this.setEventListenersCanvas();

    this.subscriptions.add(
      this.comentariosControlService.seguidorSelected$
        .pipe(
          switchMap((seguidor) => {
            this.seguidorSelected = seguidor;

            if (this.seguidorSelected !== undefined && this.seguidorSelected !== null) {
              // obtenemos imagen térmica
              this.seguidorViewCommentsService.getImageSeguidor(this.seguidorSelected, 'jpg');
              // obtenemos imagen visual
              this.seguidorViewCommentsService.getImageSeguidor(this.seguidorSelected, 'jpgVisual');

              // this.drawAnomalias();
            }

            return combineLatest([
              this.comentariosControlService.anomaliaSelected$,
              this.comentariosControlService.prevAnomaliaSelected$,
            ]);
          })
        )
        .subscribe(([anomSel, prevAnomSel]) => {
          this.anomaliaSelected = anomSel;
          this.prevAnomaliaSelected = prevAnomSel;

          // if (this.seguidorSelected !== undefined) {
          //   if (this.anomaliaSelected !== undefined) {
          //     this.setAnomaliaSelectedStyle(this.anomaliaSelected, true);
          //   }

          //   if (this.prevAnomaliaSelected !== undefined) {
          //     this.setAnomaliaSelectedStyle(this.prevAnomaliaSelected, false);
          //   }
          // }

          this.anomsCanvas.renderAll();
        })
    );

    this.subscriptions.add(
      this.seguidorViewCommentsService.urlThermalImageSeguidor$.subscribe((urlThermal) => {
        if (urlThermal !== undefined) {
          this.imageThermal.src = urlThermal;

          this.imageThermal.onload = () => {
            this.seguidorViewCommentsService.imagesLoaded = true;

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
        }
      })
    );

    this.subscriptions.add(
      this.seguidorViewCommentsService.urlVisualImageSeguidor$.subscribe((urlVisual) => {
        if (urlVisual !== undefined) {
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
        }
      })
    );
  }

  setEventListenersCanvas() {
    this.anomsCanvas.on('mouse:down', (e) => {
      if (e.target !== null) {
        if (e.target.ref === 'anom') {
          // seleccionamos la anterior como previa
          this.comentariosControlService.prevAnomaliaSelected = this.anomaliaSelected;

          // seleccionamos la nueva
          const anomaliaSelected = this.seguidorSelected.anomaliasCliente.find((anom) => anom.id === e.target.anomId);

          this.comentariosControlService.anomaliaSelected = anomaliaSelected;
        } else {
          this.comentariosControlService.anomaliaSelected = undefined;
        }
      }
    });
  }
}
