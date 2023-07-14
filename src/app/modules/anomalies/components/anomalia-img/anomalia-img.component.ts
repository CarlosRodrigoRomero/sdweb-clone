import { Component, OnDestroy, OnInit } from '@angular/core';

import { combineLatest, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import 'fabric';
declare let fabric;

import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { AnomaliaImgService } from '../../services/anomalia-img.service';

import { PcInterface } from '@core/models/pc';
import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-anomalia-img',
  templateUrl: './anomalia-img.component.html',
  styleUrls: ['./anomalia-img.component.css']
})
export class AnomaliaImgComponent implements OnInit, OnDestroy {

  private anomaliaSelected: Anomalia;
  private imageVisual = new Image();
  private imageThermal = new Image();

  imageSelected = 0;
  imagesLoaded: boolean;
  viewSelected: string;

  imageAnomalia;
  visualCanvas;
  thermalCanvas;
  anomsCanvas;
  canvas: any;
  sw = 2;
  c = [];
  strokeColor = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private anomaliasControlService: AnomaliasControlService,
    private anomaliaImgService: AnomaliaImgService
  ) {}

  ngOnInit(): void {
    // nos suscribimos a la carga de la imagen
    this.subscriptions.add(this.anomaliaImgService.imagesLoaded$.subscribe((loaded) => (this.imagesLoaded = loaded)));

    this.visualCanvas = new fabric.Canvas('visual-canvas');
    // this.seguidorViewService.visualCanvas = this.visualCanvas;
    this.thermalCanvas = new fabric.Canvas('thermal-canvas');
    // this.seguidorViewService.thermalCanvas = this.thermalCanvas;
    this.anomsCanvas = new fabric.Canvas('anomalias-canvas');
    // this.seguidorViewService.anomsCanvas = this.anomsCanvas;

    this.subscriptions.add(
      this.anomaliasControlService.anomaliaSelect$.subscribe((anomalia) => {
        this.anomaliaSelected = anomalia;
        // obtenemos imagen térmica
        this.anomaliasControlService.getImageAnomalia('jpg');
        // obtenemos imagen visual
        this.anomaliasControlService.getImageAnomalia('jpgVisual');
      })
    );

    this.subscriptions.add(
      this.anomaliasControlService.urlThermalImageAnomalia$.subscribe((urlThermal) => {
        if (urlThermal !== undefined) {
          this.imageThermal.src = urlThermal;

          this.imageThermal.onload = () => {
            this.anomaliaImgService.imagesLoaded = true;

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
      this.anomaliasControlService.urlVisualImageAnomalia$.subscribe((urlVisual) => {
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
