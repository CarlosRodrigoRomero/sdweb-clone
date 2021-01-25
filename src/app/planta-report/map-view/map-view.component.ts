import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import TileLayer from 'ol/layer/Tile';
import Map from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import View from 'ol/View';
import { PlantaService } from '../../core/services/planta.service';
import { PlantaInterface } from '../../core/models/planta';
import { transformExtent } from 'ol/proj';
import { GLOBAL } from '../../core/services/global';
import { Options } from '@angular-slider/ngx-slider';

// planta prueba: egF0cbpXnnBnjcrusoeR
@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit {
  public plantaId: string;
  public planta: PlantaInterface;
  public map: Map;
  public rangeMin: number;
  public rangeMax: number;
  public sliderMin: number;
  public sliderMax: number;
  public palette: number[][];
  public palleteJSON: string;
  value: number = 25;
  highValue: number = 60;
  options: Options = {
    floor: 25,
    ceil: 100,
  };

  constructor(private route: ActivatedRoute, private plantaService: PlantaService) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.palette = GLOBAL.ironPalette;

    this.plantaService.getPlanta(this.plantaId).subscribe((planta) => {
      this.planta = planta;

      this.rangeMin = 25;
      this.rangeMax = 100;
      this.sliderMin = 25;
      this.sliderMax = 50;
      this.palleteJSON = JSON.stringify(GLOBAL.ironPalette);

      this.initMap();
    });
  }
  rgb2temp(pixel) {
    const precision = 0.1;
    const gradosMantenerPrecision = 255 * precision;

    let max: number;
    let min: number;
    let val: number;

    const subrango = 0.1 * Math.round(10 * Math.min(gradosMantenerPrecision, (this.rangeMax - this.rangeMin) / 3));

    if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0) {
      return this.rangeMin;
    } else if (pixel[0] == 255 && pixel[1] == 255 && pixel[2] == 255) {
      return this.rangeMax;
    } else if (pixel[0] != 0) {
      max = this.rangeMin + subrango;
      min = this.rangeMin;
      val = pixel[0];
    } else if (pixel[1] != 0) {
      min = this.rangeMin + subrango;
      max = this.rangeMin + 0.1 * Math.round(10 * 2 * subrango);
      val = pixel[1];
    } else {
      max = this.rangeMax;
      min = this.rangeMin + 0.1 * Math.round(10 * 2 * subrango);
      val = pixel[2];
    }
    const temp = 0.1 * Math.round(10 * ((val * (max - min)) / 255 + min));

    return temp;
  }

  temp2palette(temperatura: number) {
    const index = Math.round(
      ((this.palette.length - 1) / (this.sliderMax - this.sliderMin)) * (temperatura - this.sliderMin)
    );

    if (index > this.palette.length - 1) {
      return this.palette[this.palette.length - 1];
    }

    return this.palette[index];
  }

  transformPixels(context) {
    const canvas = context.canvas;

    const inputData = context.getImageData(0, 0, canvas.width, canvas.height);

    var output = context.createImageData(canvas.width, canvas.height);

    // Iterate through every pixel
    for (let i = 0; i < inputData.data.length; i += 4) {
      let pixel = [inputData.data[i + 0], inputData.data[i + 1], inputData.data[i + 2], inputData.data[i + 3]];
      if (pixel[3] == 0) {
        continue;
      }
      const rgb = this.temp2palette(this.rgb2temp(pixel));
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
  }

  initMap() {
    const aerial = new XYZ({
      url: 'https://solardrontech.es/tileserver.php?/index.json?/alconera2/{z}/{x}/{y}.png',
      crossOrigin: '',
    });
    const thermalSource = new XYZ({
      url: 'https://solardrontech.es/tileserver.php?/index.json?/demo/{z}/{x}/{y}.png',
      crossOrigin: '',
    });
    const thermalLayer = new TileLayer({
      source: thermalSource,
    });

    // MAPA

    this.map = new Map({
      target: 'map',

      layers: [
        new TileLayer({
          source: aerial,
        }),
        thermalLayer,
        //   // extent: this.transform([-7.06022, 38.523619, -7.056351, 38.522765]),
        // }),
      ],
      view: new View({
        center: fromLonLat([this.planta.longitud, this.planta.latitud]),
        zoom: 18,
        maxZoom: 25,
        // extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
      }),
    });

    thermalLayer.on('postrender', (event) => {
      this.transformPixels(event.context);
    });
  }

  onChangeSlider(value) {
    this.sliderMax = this.highValue;
    this.sliderMin = value;
    this.map.render();
  }

  transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }
}
