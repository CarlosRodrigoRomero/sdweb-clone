import { Component, OnInit } from '@angular/core';
import { Seguidor } from '@core/models/seguidor';

import p5 from 'p5';
import { combineLatest } from 'rxjs';

import { SeguidoresControlService } from '../../services/seguidores-control.service';

@Component({
  selector: 'app-seguidor-images',
  templateUrl: './seguidor-images.component.html',
  styleUrls: ['./seguidor-images.component.css'],
})
export class SeguidorImagesComponent implements OnInit {
  public urlImageSeguidor: string;
  private seguidorSelected: Seguidor;

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

    this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
      this.seguidorSelected = seguidor;

      if (this.drawAnomalias === undefined) {
        this.drawAnomalias = (p) => {
          p.setup = () => {
            this.anomsCanvas = p.createCanvas(640, 512);
            this.anomsCanvas.parent('canvas-anomalias');
          };

          p.draw = () => {
            p.noFill();
            p.strokeWeight(this.sw);

            p.beginShape();
            p.vertex(30, 20);
            p.vertex(85, 20);
            p.vertex(85, 75);
            p.vertex(30, 75);
            p.endShape(p.CLOSE);
          };
        };

        this.canvas = new p5(this.drawAnomalias);
      }
    });

    this.seguidoresControlService.urlImageVisualSeguidor$.subscribe((url) => (this.urlImageSeguidor = url));
  }
}
