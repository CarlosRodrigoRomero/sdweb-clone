import { Component, OnInit } from '@angular/core';
import * as exifr from 'exifr';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { XYZ } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { View } from 'ol';
import { fromLonLat, transform } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control.js';
import { Observable, Subscription } from 'rxjs';
import { OlMapService } from '@data/services/ol-map.service';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';

import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { finalize } from 'rxjs/operators';


export interface ImageData {
  key: string;
  value: any;
  GPSLatitude: number;
  GPSLongitude: number;
  name: string;

  //Pruebas para clasificar en grupos
  lat?: number;
  long?: number;
  group?: number;
  center?: [number, number]; // Agregar esta línea para almacenar el centro del grupo

}

@Component({
  selector: 'app-flight-upload',
  templateUrl: './flight-upload.component.html',
  styleUrls: ['./flight-upload.component.css']
})
export class FlightUploadComponent implements OnInit {

  defaultLng = -4;
  defaultLat = 40;
  defaultZoom = 5.5;
  map: Map;


  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  task: AngularFireUploadTask;

  selectedFiles: File[] = [];

  uploadSpeed: number = 0; // Aquí guardaremos la velocidad de subida
  uploadStartTime: number; // Hora de inicio de la subida
  uploadEndTime: number; // Hora de finalización de la subida
  totalBytesTransferred: number = 0; // Total de bytes transferidos

  totalBytes: number;
  private subscriptions: Subscription = new Subscription();


  ngOnInit(): void {
    this.initMap();

  }

  initMap() {
    const source = new XYZ({
      url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', // hidrido
      // url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}', // satelite
      crossOrigin: '',
    });
    const layer = new TileLayer({
      source,
    });
    const view = new View({
      center: fromLonLat([this.defaultLng, this.defaultLat]),
      zoom: this.defaultZoom,
    });
    const controls = defaultControls({ attribution: false, zoom: false });

    // creamos el mapa a traves del servicio y nos subscribimos a el
    this.subscriptions.add(
      this.olMapService.createMap('map', [layer], view, controls).subscribe((map) => (this.map = map))
    );
  }


  imagesData: any[] = [];
  imageGroups: ImageData[][] = [];

  currentIndex = 0;
  fileName: string = "";

  imageThumbnails: SafeUrl[] = [];

  //Pruebas para clasificar en grupos
  currentGroup = 0;

  constructor(private sanitizer: DomSanitizer,
    private olMapService: OlMapService,
    private storage: AngularFireStorage,

  ) { }
  async handleChange(event) {

    this.selectedFiles = Array.from(event.target.files);



    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];

      // Ignorar los archivos que no sean jpg dando un aviso al usuario
      if (file.type !== 'image/jpeg') {
        alert(`Estás intentando subir el archivo ${file.name} y es de tipo ${file.type}. Este archivo se ignorará. Solo se procesarán archivos .jpg`);
        continue;
      }

      const output: ImageData = await exifr.parse(file, ['GPSLatitude', 'GPSLongitude']);

      // Comprobar si el archivo tiene información de coordenadas GPS
      if (!output || !output.GPSLatitude || !output.GPSLongitude) {
        alert(`El archivo ${file.name} no contiene información de GPS. Este archivo se ignorará.`);
      }
      else {

        output.name = file.name;

        // Convertir las coordenadas de DMS a decimal
        output.GPSLatitude = this.dmsToDecimal(output.GPSLatitude[0], output.GPSLatitude[1], output.GPSLatitude[2]);
        output.GPSLongitude = this.dmsToDecimal(output.GPSLongitude[0], output.GPSLongitude[1], output.GPSLongitude[2]);

        const thumbnail = await exifr.thumbnail(file);
        this.imagesData.push(output);
        this.imageThumbnails.push(this.getSanitizedUrl(thumbnail));

        // Asignar cada imagen a un grupo basado en su proximidad a todas las imágenes en el grupo
        let assigned = false;
        for (let group of this.imageGroups) {
          for (let groupImage of group) {
            if (this.calculateDistance(output.GPSLatitude, output.GPSLongitude, groupImage.GPSLatitude, groupImage.GPSLongitude) <= 0.5) {
              group.push(output);
              assigned = true;
              break;
            }
          }
          if (assigned) break;
        }
        if (!assigned) {
          this.imageGroups.push([output]);

          // Calcula el centro del grupo
          let latSum = 0, lonSum = 0;
          for (let image of this.imageGroups[this.imageGroups.length - 1]) {
            latSum += image.GPSLatitude;
            lonSum += image.GPSLongitude;
          }
          const center: [number, number] = [-lonSum / this.imageGroups[this.imageGroups.length - 1].length, latSum / this.imageGroups[this.imageGroups.length - 1].length] as [number, number];

          // Almacena el centro en cada imagen del grupo
          for (let image of this.imageGroups[this.imageGroups.length - 1]) {
            image.center = center;
          }
        }
      }
    }


    this.addImageMarkersAndPolygon();
  }


  dmsToDecimal(degrees: number, minutes: number, seconds: number) {
    return degrees + minutes / 60 + seconds / 3600;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // radio medio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // distancia en km
    return d;
  }

  uploadFiles() {
    this.uploadStartTime = new Date().getTime();

    // Calcular el tamaño total de los archivos en bytes
    this.totalBytes = this.selectedFiles.reduce((total, file) => total + file.size, 0);

    this.selectedFiles.forEach(async (file) => {
      const filePath = `images/${new Date().getTime()}_${file.name}`;
      this.task = this.storage.upload(filePath, file);

      // Observar el porcentaje de subida
      this.uploadPercent = this.task.percentageChanges();

      // Observar el estado de la subida y calcular la velocidad
      this.task.snapshotChanges().subscribe(snapshot => {
        this.uploadEndTime = new Date().getTime();
        this.totalBytesTransferred = snapshot.bytesTransferred;

        let elapsedTime = this.uploadEndTime - this.uploadStartTime; // Tiempo transcurrido en milisegundos
        elapsedTime = elapsedTime / 1000; // Convertir a segundos

        // Calcular la velocidad de subida en MB/segundo
        this.uploadSpeed = (this.totalBytesTransferred / (1024 * 1024)) / elapsedTime;
        console.log("Total bytes transfered: " + this.totalBytesTransferred);
        console.log("Snapshot bytes transfered: " + snapshot.bytesTransferred);

        console.log("Elapsed Time: " + elapsedTime);
        console.log("Total bytes: " + this.totalBytes);

      });
    });
  }


  deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  nextImage() {
    if (this.currentIndex < this.imagesData.length - 1) {
      this.currentIndex++;
    }
  }

  prevImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  get currentImage() {
    return this.imagesData[this.currentIndex];
  }

  getSanitizedUrl(buffer: Buffer | Uint8Array): SafeUrl {
    let TYPED_ARRAY = new Uint8Array(buffer);
    const STRING_CHAR = TYPED_ARRAY.reduce((data, byte) => {
      return data + String.fromCharCode(byte);
    }, '');
    let base64String = btoa(STRING_CHAR);
    return this.sanitizer.bypassSecurityTrustUrl('data:image/jpeg;base64,' + base64String);
  }


  addImageMarkersAndPolygon() {
    this.map.getLayers().forEach(layer => {
      if (layer instanceof VectorLayer) {
        this.map.removeLayer(layer);
      }
    });

    const vectorLayers = [];

    this.imageGroups.forEach((group, groupIndex) => {
      const vectorSource = new Vector({
        features: [],
      });

      let minLat = Number.POSITIVE_INFINITY;
      let maxLat = Number.NEGATIVE_INFINITY;
      let minLon = Number.POSITIVE_INFINITY;
      let maxLon = Number.NEGATIVE_INFINITY;

      group.forEach((image) => {
        const lat = image.GPSLatitude;
        const lon = image.GPSLongitude;

        console.log(image.GPSLatitude + " " + image.GPSLongitude)
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);

        const coordinates = transform([-lon, lat], 'EPSG:4326', 'EPSG:3857');
        const feature = new Feature({
          geometry: new Point(coordinates),
        });

        const iconStyle = new Style({
          image: new Icon({
            src: '../../../../../assets/icons/location-pin-dark-unhover.png',
            scale: 0.5,
          }),
        });

        feature.setStyle(iconStyle);
        vectorSource.addFeature(feature);
      });

      const polygonCoordinates = [
        [fromLonLat([-minLon, maxLat]), fromLonLat([-maxLon, maxLat]), fromLonLat([-maxLon, minLat]), fromLonLat([-minLon, minLat]), fromLonLat([-minLon, maxLat])],
      ];
      const polygonFeature = new Feature({
        geometry: new Polygon(polygonCoordinates),
      });

      const polygonStyle = new Style({
        stroke: new Stroke({
          color: 'blue',
          width: 2,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0.1)',
        }),
      });

      polygonFeature.setStyle(polygonStyle);
      vectorSource.addFeature(polygonFeature);

      const vectorLayer = new VectorLayer({
        source: vectorSource,
      });

      vectorLayers.push(vectorLayer);
    });

    vectorLayers.forEach(layer => {
      this.map.addLayer(layer);
    });


    if (vectorLayers.length > 0) {
      const lastVectorLayer = vectorLayers[vectorLayers.length - 1];
      const lastPolygonExtent = lastVectorLayer.getSource().getExtent();
      this.map.getView().fit(lastPolygonExtent, { padding: [50, 50, 50, 50], maxZoom: 18 });
    }

  }

  goToGroupCenter(center: [number, number]) {
    console.log(center);
    const view = this.map.getView();
    view.animate({ center: fromLonLat(center), zoom: 16 });
  }
}