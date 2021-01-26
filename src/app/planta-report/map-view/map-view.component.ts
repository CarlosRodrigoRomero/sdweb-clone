import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import TileLayer from 'ol/layer/Tile';
import Map from 'ol/Map';
import XYZ_mod from '../xyz_mod.js';
import { fromLonLat } from 'ol/proj';
import View from 'ol/View';
import { PlantaService } from '../../core/services/planta.service';
import { PlantaInterface } from '../../core/models/planta';
import { transformExtent } from 'ol/proj';
import { Options } from '@angular-slider/ngx-slider';
import ImageTileMod from '../ImageTileMod.js';
import { MapControlService } from '../services/map-control.service.js';

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
  public palleteJSON: string;
  public thermalSource;
  value: number = 25;
  highValue: number = 60;
  options: Options = {
    floor: 25,
    ceil: 100,
  };

  constructor(
    private mapControlService: MapControlService,
    private route: ActivatedRoute,
    private plantaService: PlantaService
  ) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');

    this.plantaService.getPlanta(this.plantaId).subscribe((planta) => {
      this.planta = planta;

      this.rangeMin = 25;
      this.rangeMax = 100;
      this.mapControlService.sliderMin = this.value;
      this.mapControlService.sliderMax = this.highValue;

      this.initMap();
    });
  }

  // private transformPixels(context) {
  //   if (context == undefined) {
  //     return context;
  //   }
  //   const canvas = context.getImage();
  //   if (canvas == undefined) {
  //     return context;
  //   }
  //   context = canvas.getContext('2d');
  //   const inputData = context.getImageData(0, 0, canvas.width, canvas.height);

  //   var output = context.createImageData(canvas.width, canvas.height);

  //   // Iterate through every pixel
  //   for (let i = 0; i < inputData.data.length; i += 4) {
  //     let pixel = [inputData.data[i + 0], inputData.data[i + 1], inputData.data[i + 2], inputData.data[i + 3]];
  //     if (pixel[3] == 0) {
  //       continue;
  //     }
  //     const rgb = this.temp2palette(this.rgb2temp(pixel));
  //     if (rgb != null) {
  //       pixel[0] = rgb[0];
  //       pixel[1] = rgb[1];
  //       pixel[2] = rgb[2];
  //     }

  //     // Modify pixel data
  //     output.data[i + 0] = pixel[0]; // R value
  //     output.data[i + 1] = pixel[1]; // G value
  //     output.data[i + 2] = pixel[2]; // B value
  //     output.data[i + 3] = pixel[3]; // A value
  //   }
  //   context.putImageData(output, 0, 0);
  //   return context;
  // }

  initMap() {
    const aerial = new XYZ_mod({
      url: 'https://solardrontech.es/tileserver.php?/index.json?/alconera2/{z}/{x}/{y}.png',
      crossOrigin: '',
    });
    this.thermalSource = new XYZ_mod({
      url: 'https://solardrontech.es/tileserver.php?/index.json?/demo/{z}/{x}/{y}.png',
      crossOrigin: '',
      tileClass: ImageTileMod,
      transition: 255,
      tileLoadFunction: (imageTile, src) => {
        imageTile.mapControlService = this.mapControlService;
        // imageTile.sliderMin = this.mapControlService.sliderMin;
        // imageTile.sliderMax = this.mapControlService.sliderMax;
        imageTile.getImage().src = src;
        // imageTile.setImageSource(src);
      },
    });
    this.thermalSource.on('change', (event) => {
      // this.transformPixels(event.context);
    });

    const thermalLayer = new TileLayer({
      source: this.thermalSource,
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
  }

  onChangeSlider(value) {
    this.mapControlService.sliderMax = this.highValue;
    this.mapControlService.sliderMin = value;
    this.thermalSource.changed();
  }

  transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }
}
