import { Component, OnInit } from '@angular/core';
// import { MapService } from 'src/app/services/orto.service';

import OlMap from 'ol/Map';
import OlTileLayer from 'ol/layer/Tile';
import OlView from 'ol/View';
import BingMaps from 'ol/source/BingMaps.js';
import Draw from 'ol/interaction/Draw.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import {Vector as VectorSource} from 'ol/source.js';
import { transform } from 'ol/proj.js';
import { fromLonLat } from 'ol/proj.js';
import { PcInterface } from 'src/app/models/pc';
import { InformeInterface } from 'src/app/models/informe';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-ortophoto',
  templateUrl: './ortophoto.component.html',
  styleUrls: ['./ortophoto.component.css']
})
export class OrtophotoComponent implements OnInit {

  public draw: Draw;
  public sourceVector: VectorSource;
  public vectorLayer: VectorLayer;
  public map: OlMap;
  public localIdCount = 0;
  public informe: InformeInterface;

  constructor(
    private route: ActivatedRoute,
  ) {}


  ngOnInit() {
    this.getInforme();

    this.initializeMap();

    const polyCoords = [[
      transform([-5.950534343719482, 39.45960594494292], 'EPSG:4326', 'EPSG:3857'),
      transform([-5.949568748474121, 39.459655645582245], 'EPSG:4326', 'EPSG:3857'),
      transform([-5.949075222015382, 39.45892669931527], 'EPSG:4326', 'EPSG:3857'),
      transform([-5.950169563293458, 39.45892669931527], 'EPSG:4326', 'EPSG:3857')
    ]];

    this.addInteraction();
    const feature = new Feature({
      name: 'Thing',
      geometry: new Polygon(polyCoords)
    });

    this.sourceVector.addFeature(feature);

  }

  private initializeMap() {
    const tileLayer = new OlTileLayer({
      visible: true,
      preload: Infinity,
      opacity: 0.7,
      source: new BingMaps({
        key: 'AmrHxZyU8hrVNu9GLgZtIOhl6dpsenwhiMChTYpdK2NDNjcrvzfsF6odi1NbS-6u',
        imagerySet: 'Aerial',
      })
    });
    this.sourceVector = new VectorSource({ wrapX: false });
    this.vectorLayer = new VectorLayer({
      source: this.sourceVector,
    });
    this.map = new OlMap({
      target: 'mapid',
      layers: [
        this.vectorLayer,
        tileLayer,
      ],
      loadTilesWhileInteracting: true,
      view: new OlView({
        center: fromLonLat([-5.9505580, 39.460472]),
        zoom: 16
      })
    });
  }

  getInforme() {
    const informeId = this.route.snapshot.paramMap.get('id');
  }

  onMouseMove(browserEvent) {
     // the mousemove event sends a browser event object that contains
        // the geographic coordinate the event happened at
        const coordinate = browserEvent.coordinate;
        console.log('coordinate', coordinate);
        console.log('vectorLayer', this.vectorLayer);
        // we can get the closest feature from the source
        const feature = this.sourceVector.getClosestFeatureToCoordinate(coordinate);
        // to compute the area of a feature, we need to get it's geometry and do
        // something a little different depeneding on the geometry type.
        const geometry = feature.getGeometry();
        let area: number;
        switch (geometry.getType()) {
        case 'MultiPolygon':
          // for multi-polygons, we need to add the area of each polygon
          area = geometry.getPolygons().reduce( (left, right) => {
            return left + right.getArea();
          }, 0);
          break;
        case 'Polygon':
          // for polygons, we just get the area
          area = geometry.getArea();
          break;
        default:
          // no other geometry types have area as far as we are concerned
          area = 0;
        }
        area = area / 1000000;
        // display the country name and area now
        const text = feature.getProperties().name + ' ' + area.toFixed(0) + ' km<sup>2</sup>';
        document.getElementById('closestFeature').innerHTML = text;
  }

  addInteraction() {
    const value = 'Polygon';
    this.draw = new Draw({
      source: this.sourceVector,
      type: value,
      maxPoints: 4,
      minPoints: 4,
      });


    this.draw.on('drawend', (event: Draw.Event) => {
      this.onFinishDraw(event);

      // TODO: Añadir pc a base de datos
      // TODO: Extraer todos los datos del PC.

    });
    this.map.addInteraction(this.draw);
  }

    onFinishDraw(event: Draw.Event) {
      this.localIdCount += 1;

      // Obtener coordenadas polígono
      const coordsPolygon = event.target.sketchCoords_[0];
      // Si queremos transformarlo a LatLon:
      // const coordsPolygon = event.target.sketchCoords_[0].map( coords => {
      //   return transform(coords, 'EPSG:3857', 'EPSG:4326');
      // });

      // setActiveObject

      // obtener centro GPS

      // crear pc (PcInterface)
      const newPc: PcInterface = {
        id: '',
        polygonCoords: coordsPolygon,
      //   // archivo: this.currentFileName,
        tipo: 1, // tipo
        local_x: 1, // local_x
        local_y: 0, // local_x
        global_x: 0, // global_x
        global_y: '', // global_y
      //   gps_lng: this.current_gps_lng,
      //   gps_lat: this.current_gps_lat,
      //   temperatura: max_temp.max_temp,
      //   temperaturaMax: max_temp.max_temp,
      //   img_left: act_obj_raw.left,
      //   img_top: act_obj_raw.top,
      //   img_width: act_obj_raw_coords.width,
      //   img_height: act_obj_raw_coords.height,
      //   img_x: max_temp.max_temp_x, // coordenadas raw
      //   img_y: max_temp.max_temp_y, // coordenadas raw
        local_id: this.localIdCount,
      //   vuelo: this.currentFlight,
      //   image_rotation: this.current_image_rotation,
        // informeId: this.informe.id,
      //   datetime: this.current_datetime,
        severidad: 0,
        resuelto: false
      };
      console.log('new_pc', newPc);

    }
    // const features = this.sourceVector.getFeatures();
    // features.forEach( (feature) => {
    //    console.log(feature.getGeometry().getCoordinates());
    // });
  }


//     this.map.on('pointermove', (browserEvent: any) => {
//       const coordinate = browserEvent.coordinate;
//       console.log('coordinate', coordinate);
//       const feature = this.sourceVector.getClosestFeatureToCoordinate(coordinate);
//       const geometry = feature.getGeometry();
//       console.log('getFeatures', this.sourceVector.getFeatures());
//       let area: number;
//       switch (geometry.getType()) {
//       case 'MultiPolygon':
//         // for multi-polygons, we need to add the area of each polygon
//         area = geometry.getPolygons().reduce( (left, right) => {
//           return left + right.getArea();
//         }, 0);
//         break;
//       case 'Polygon':
//         // for polygons, we just get the area
//         area = geometry.getArea();
//         break;
//       default:
//         // no other geometry types have area as far as we are concerned
//         area = 0;
//       }
//       area = area / 1000000;
//       // display the country name and area now
//       const text = feature.getProperties().name + ' ' + area.toFixed(1) + ' km<sup>2</sup>';
//       document.getElementById('closestFeature').innerHTML = text;
// });