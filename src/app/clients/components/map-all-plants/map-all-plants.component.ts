import { Component, ElementRef, Input, OnInit } from '@angular/core';
import 'ol/ol.css';
import Circle from 'ol/geom/Circle';

import { defaults as defaultControls } from 'ol/control.js';

import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { Fill, Stroke, Style } from 'ol/style';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { switchMap } from 'rxjs/operators';
import { fromLonLat } from 'ol/proj';
import { PlantaInterface } from '@core/models/planta';
import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

@Component({
  selector: 'app-map-all-plants',
  templateUrl: './map-all-plants.component.html',
  styleUrls: ['./map-all-plants.component.css'],
})
export class MapAllPlantsComponent implements OnInit {
  plantas: PlantaInterface[];
  defaultLng = -4;
  defaultLat = 40;
  defalutZoom = 6;

  geojsonObject: any;

  map: any;

  constructor(private plantaService: PlantaService, public auth: AuthService, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.auth.user$
      .pipe(
        switchMap((user) => {
          return this.plantaService.getPlantasDeEmpresa(user);
        })
      )
      .subscribe((plantas) => {
        this.plantas = plantas;
        this.initMap();
        const vectorSource = new VectorSource({});

        plantas.forEach((planta) => {
          vectorSource.addFeature(new Feature(new Circle(fromLonLat([planta.longitud, planta.latitud]), 1e4)));
        });
        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            stroke: new Stroke({
              color: 'red',
              width: 2,
            }),
            fill: new Fill({
              color: 'rgba(255,0,0,0.3)',
            }),
          }),
        });
        this.map.addLayer(vectorLayer);
      });
  }

  initMap() {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([this.defaultLng, this.defaultLat]),
        zoom: this.defalutZoom,
      }),
      controls: defaultControls({ attribution: false, zoom: false }).extend([]),
    });
  }
}
