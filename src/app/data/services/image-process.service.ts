import { Injectable } from '@angular/core';

import { ThermalService } from '@data/services/thermal.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { ReportControlService } from '@data/services/report-control.service';

import { PALETTE } from '@data/constants/palette';

@Injectable({
  providedIn: 'root',
})
export class ImageProcessService {
  private palette = PALETTE.ironPalette;
  private sliderMin = 25;
  private sliderMax = 75;
  private sliderFloor = 25;
  private sliderCeil = 100;
  private thermalLayer: ThermalLayerInterface;
  private indexSelected = 0;

  constructor(private thermalService: ThermalService, private reportControlService: ReportControlService) {}

  setSliderValues(index: number) {
    this.sliderMin = this.thermalService.sliderMin[index];
    this.sliderMax = this.thermalService.sliderMax[index];
    this.sliderFloor = this.thermalLayer.rangeTempMin;
    this.sliderCeil = this.thermalLayer.rangeTempMax;
  }

  private getIndexThermalLayer(informeId: string) {
    return this.reportControlService.informes.findIndex((informe) => informe.id === informeId);
  }

  transformPixels(image: any, informeId: string) {
    this.thermalLayer = this.thermalService.thermalLayersDB.find((tL) => tL.informeId === informeId);

    // obtenemos el indice de la capa
    this.indexSelected = this.getIndexThermalLayer(informeId);

    // seteamos los valores actuales del slider
    this.setSliderValues(this.indexSelected);

    let canvas = document.createElement('canvas');
    canvas = this.drawImage_(image, canvas);
    const context = canvas.getContext('2d');

    if (canvas.width == 0) {
      return image;
    }

    const inputData = context.getImageData(0, 0, canvas.width, canvas.height);

    const output = context.createImageData(canvas.width, canvas.height);

    // Iterate through every pixel
    for (let i = 0; i < inputData.data.length; i += 4) {
      const pixel = [inputData.data[i + 0], inputData.data[i + 1], inputData.data[i + 2], inputData.data[i + 3]];
      if (pixel[3] == 0) {
        continue;
      }

      const rgb = this.temp2palette_(this.rgb2temp_(pixel));
      if (rgb != null) {
        pixel[0] = rgb[0];
        pixel[1] = rgb[1];
        pixel[2] = rgb[2];
      }

      // Modify pixel data
      output.data[i + 0] = pixel[0]; // R value
      output.data[i + 1] = pixel[1]; // G value
      output.data[i + 2] = pixel[2]; // B value
      output.data[i + 3] = pixel[3]; // A value
    }
    context.putImageData(output, 0, 0);

    return canvas;
  }

  drawImage_(image, canvas) {
    // Set the canvas the same width and height of the image
    canvas.width = image.width;
    canvas.height = image.height;

    canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
    return canvas;
  }

  temp2palette_(temperatura: number) {
    const index = Math.round(
      ((this.palette.length - 1) / (this.sliderMax - this.sliderMin)) * (temperatura - this.sliderMin)
    );

    if (index > this.palette.length - 1) {
      return this.palette[this.palette.length - 1];
    }
    if (temperatura < this.sliderMin) {
      return this.palette[0];
    }

    return this.palette[index];
  }

  rgb2temp_(pixel: number[]) {
    if (this.thermalLayer.codificationType === undefined || this.thermalLayer.codificationType === 'rgb') {
      const precision = 0.1;
      const gradosMantenerPrecision = 255 * precision;

      let max;
      let min;
      let val;
      let maxVal = 0;
      if (pixel[0] > maxVal) {
        maxVal = pixel[0];
      }
      if (pixel[1] > maxVal) {
        maxVal = pixel[1];
      }
      if (pixel[2] > maxVal) {
        maxVal = pixel[2];
      }

      const subrango = Math.round(10 * gradosMantenerPrecision) / 10;

      if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
        return this.sliderFloor;
      } else if (pixel[0] == 255 && pixel[1] == 255 && pixel[2] == 255) {
        return this.sliderCeil;
      } else if (pixel[0] == maxVal) {
        max = this.sliderFloor + subrango;
        min = this.sliderFloor;
        val = pixel[0];
      } else if (pixel[1] == maxVal) {
        min = this.sliderFloor + subrango;
        max = this.sliderFloor + 0.1 * Math.round(10 * 2 * subrango);
        val = pixel[1];
      } else {
        max = this.sliderCeil;
        min = this.sliderFloor + 0.1 * Math.round(10 * 2 * subrango);
        val = pixel[2];
      }
      const temp = 0.1 * Math.round(10 * ((val * (max - min)) / 255 + min));

      return temp;
    } else if (this.thermalLayer.codificationType === 'rainbowHc') {
      const centenas = 255 - pixel[0];
      const decenas = 255 - pixel[1];
      const unidades = 255 - pixel[2];
      const decimales = 255 - pixel[3];

      const tempString = centenas.toString() + decenas.toString() + unidades.toString() + '.' + decimales.toString();

      return parseFloat(tempString);
    }
  }

  resetService() {
    this.sliderMin = 25;
    this.sliderMax = 75;
    this.sliderFloor = 25;
    this.sliderCeil = 100;
    this.thermalLayer = undefined;
  }
}
