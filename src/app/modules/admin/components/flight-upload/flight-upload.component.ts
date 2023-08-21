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
import LineString from 'ol/geom/LineString';
import geolib from 'geolib';
import { getDistance } from 'geolib';

export interface ImageData {
  key: string;
  value: any;
  GPSLatitude: number;
  GPSLongitude: number;
  name: string;

  GPSAltitude: number;

  lat?: number;
  long?: number;
  group?: number;
  center?: [number, number]; // Agregar esta línea para almacenar el centro del grupo

  SerialNumber: string;
  suffix: string;
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

  fotoPortadaName: string = '';
  fotoSuciedadName: string = '';

  public showV: boolean = true;
  public showT: boolean = true;

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

  isDataReady: boolean;

  numeroImagenesTermicas: number = 0;
  numeroImagenesRGB: number = 0;

  constructor(private sanitizer: DomSanitizer,
    private olMapService: OlMapService,
    private storage: AngularFireStorage,

  ) { }

  async handleChange(event) {
    this.selectedFiles = Array.from(event.target.files);

    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];

      if (file.type !== 'image/jpeg') {
        alert(`Estás intentando subir el archivo ${file.name} y es de tipo ${file.type}. Este archivo se ignorará. Solo se procesarán archivos .jpg`);
        continue;
      }

      const output: ImageData = await exifr.parse(file);

      if (!output || !output.GPSLatitude || !output.GPSLongitude) {
        alert(`El archivo ${file.name} no contiene información de GPS. Este archivo se ignorará.`);
      } else {
        output.name = file.name;
        output.GPSLatitude = this.dmsToDecimal(output.GPSLatitude[0], output.GPSLatitude[1], output.GPSLatitude[2]);
        output.GPSLongitude = this.dmsToDecimal(output.GPSLongitude[0], output.GPSLongitude[1], output.GPSLongitude[2]);
        const thumbnail = await exifr.thumbnail(file);
        this.imagesData.push(output);
        this.imageThumbnails.push(this.getSanitizedUrl(thumbnail));

        let assigned = false;
        let currentSuffix = this.getSuffix(output.name);
        console.log("Current suffix: " + currentSuffix);
        output.suffix = currentSuffix;
        if (currentSuffix == "V") {
          this.numeroImagenesRGB++;
        } else if (currentSuffix == "T") {
          this.numeroImagenesTermicas++;
        }
        for (let group of this.imageGroups) {
          // Verificar si el número de serie de la imagen es el mismo del grupo
          if (group[0].SerialNumber !== output.SerialNumber) continue;

          // Luego, verificar si el sufijo de la imagen es el mismo del grupo
          if (this.getSuffix(group[0].name) !== currentSuffix) continue;

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
          let latSum = 0, lonSum = 0;
          for (let image of this.imageGroups[this.imageGroups.length - 1]) {
            latSum += image.GPSLatitude;
            lonSum += image.GPSLongitude;
          }
          const center: [number, number] = [-lonSum / this.imageGroups[this.imageGroups.length - 1].length, latSum / this.imageGroups[this.imageGroups.length - 1].length] as [number, number];
          for (let image of this.imageGroups[this.imageGroups.length - 1]) {
            image.center = center;
          }
        }
      }
    }

    console.log(this.imageGroups);


    this.imageGroups.forEach(group => {
      group.sort((a, b) => {
        const dateA = new Date(this.extractDateTimeFromName(a.name)).getTime();
        const dateB = new Date(this.extractDateTimeFromName(b.name)).getTime();

        if (dateA === dateB) {
          const numA = this.extractNumberFromName(a.name);
          const numB = this.extractNumberFromName(b.name);
          return numA - numB;
        }

        return dateA - dateB;
      });
    });



    console.log(this.imageGroups);
    this.addImageMarkersAndPolygon();

    for (let i = 0; i < this.imageGroups.length; i++) {
      this.verificarAltitud(this.imageGroups[i]);
      let distanciaModaGrupo = this.distanciaModa(this.imageGroups[i]);
      this.drawRouteLines(this.imageGroups[i], distanciaModaGrupo, i);
    }

    if(this.numeroImagenesRGB != this.numeroImagenesTermicas){
      alert(`El número de imágenes RGB y térmicas NO COINCIDE. Imágenes RGB: ${this.numeroImagenesRGB}, Imágenes térmicas ${this.numeroImagenesTermicas}.`)
    }else{
      alert(`El número de imágenes RGB y térmicas SÍ COINCIDE. Imágenes RGB: ${this.numeroImagenesRGB}, Imágenes térmicas ${this.numeroImagenesTermicas}.`)

    }

    this.isDataReady = true;

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

        let iconStyle;
        if (group[0].suffix == "V") {
          iconStyle = new Style({
            image: new Icon({
              src: '../../../../../assets/icons/location-pin-dark-unhover.png',
              scale: 0.35,
            }),
          });
        }

        else if (group[0].suffix == "T") {
          iconStyle = new Style({
            image: new Icon({
              src: '../../../../../assets/icons/location-pin-light-hover.png',
              scale: 0.35,
            }),
          });
        }




        feature.setStyle(iconStyle);
        vectorSource.addFeature(feature);
      });

      const polygonCoordinates = [
        [fromLonLat([-minLon, maxLat]), fromLonLat([-maxLon, maxLat]), fromLonLat([-maxLon, minLat]), fromLonLat([-minLon, minLat]), fromLonLat([-minLon, maxLat])],
      ];
      const polygonFeature = new Feature({
        geometry: new Polygon(polygonCoordinates),
      });


      let polygonStyle;

      if (group[0].suffix == "V") {

        polygonStyle = new Style({
          stroke: new Stroke({
            color: 'blue',
            width: 2,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)',
          }),
        });

      }
      else if (group[0].suffix == "T") {
        polygonStyle = new Style({
          stroke: new Stroke({
            color: 'red',
            width: 2,
          }),
          fill: new Fill({
            color: 'rgba(255, 0, 0, 0.1)',
          }),
        });
      }
      polygonFeature.setStyle(polygonStyle);
      vectorSource.addFeature(polygonFeature);

      const vectorLayer = new VectorLayer({
        source: vectorSource,
      });

      // Asignar el suffix a la capa aquí
      vectorLayer.set('suffix', group[0].suffix);


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


  distanciaModa(datos) {
    const distancias = [];
    for (let i = 1; i < datos.length; i++) {
      const distancia = getDistance(
        { latitude: datos[i - 1].latitude, longitude: datos[i - 1].longitude },
        { latitude: datos[i].latitude, longitude: datos[i].longitude }
      );
      distancias.push(Math.round(distancia * 10) / 10);
    }

    const counts = {};
    distancias.forEach((distancia) => {
      counts[distancia] = (counts[distancia] || 0) + 1;
    });

    let maxCount = 0;
    let moda = null;
    for (const distancia in counts) {
      if (counts[distancia] > maxCount) {
        maxCount = counts[distancia];
        moda = distancia;
      }
    }
    console.log("Moda: " + moda);
    return moda;
  }


  drawRouteLines(group: ImageData[], distanciaModa: number, groupIndex) {
    // console.log("entered on drawRouteLines");
    const topeModa = distanciaModa * 2;

    for (let i = 1; i < group.length; i++) {
      const coordinates = []; // Inicializar un nuevo arreglo para cada línea
      const coord1 = [-group[i - 1].GPSLongitude, group[i - 1].GPSLatitude];
      const coord2 = [-group[i].GPSLongitude, group[i].GPSLatitude];
      const distancia = this.calculateDistance(coord1[1], coord1[0], coord2[1], coord2[0]) * 1000;

      let color;

      if (distancia <= topeModa) {
        color = 'green';
      } else if (topeModa < distancia && distancia <= distanciaModa * 3) {
        const factorTransicion = (distancia - topeModa) / (distanciaModa);
        const colorVerde = Math.floor((1 - factorTransicion) * 255);
        const colorRojo = Math.floor(factorTransicion * 255);
        color = `rgb(${colorRojo}, ${colorVerde}, 0)`;
      } else {
        color = 'red';
      }

      coordinates.push(fromLonLat(coord1));
      coordinates.push(fromLonLat(coord2));

      const lineString = new LineString(coordinates);
      const feature = new Feature({ geometry: lineString });
      const lineStyle = new Style({
        stroke: new Stroke({
          color: color,
          width: 6,
        }),
      });
      feature.setStyle(lineStyle);

      // console.table(this.map.getLayers());
      // Assuming vectorSource is the Vector source for the group
      const layer = this.map.getLayers().item(groupIndex + 1);
      // console.log('layer:', layer);

      if (layer instanceof VectorLayer || layer instanceof TileLayer) {
        const vectorSource = layer.getSource();
        // console.log("Vector source: " + vectorSource);
        // console.table(vectorSource);
        vectorSource.addFeature(feature);

        // console.log("Added feature to vectorSource: ")
        // console.table(feature);
      }
    }
  }

  handleFotoPortadaChange(event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      this.fotoPortadaName = input.files[0].name;
    }
  }
  handleFotoSuciedadChange(event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      this.fotoSuciedadName = input.files[0].name;
    }
  }


  extractDateTimeFromName(name) {
    const match = name.match(/^DJI_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;  // Meses en JavaScript son 0-indexados
      const day = parseInt(match[3], 10);
      const hour = parseInt(match[4], 10);
      const minute = parseInt(match[5], 10);
      const second = parseInt(match[6], 10);
      return new Date(year, month, day, hour, minute, second);
    }
    return null;
  }


  getSuffix(name) {
    // La expresión regular busca un guion bajo seguido de una 'V' o 'T', justo antes de la extensión del archivo (e.g. .jpg)
    const regex = /_([VT])\.\w+$/;
    const match = name.match(regex);
    return match ? match[1] : null;
  }

  toggleLayers(suffix: string, isVisible: boolean) {
    this.map.getLayers().forEach(layer => {
      if (layer instanceof VectorLayer && layer.get("suffix") === suffix) {
        layer.setVisible(isVisible);
      }
    });
  }

  extractNumberFromName(name: string): number {
    const match = name.match(/_(\d+)_/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return -1;  // Retorna un valor por defecto en caso de no encontrar el número.
  }

  calcularModa(valores) {
    const counts = {};
    valores.forEach((valor) => {
      counts[valor] = (counts[valor] || 0) + 1;
    });

    let maxCount = 0;
    let moda = null;
    for (const valor in counts) {
      if (counts[valor] > maxCount) {
        maxCount = counts[valor];
        moda = parseFloat(valor);
      }
    }
    return moda;
  }


  verificarAltitud(datos) {
    const altitudes = datos.map(dato => {
      if (dato.GPSAltitude !== null && dato.GPSAltitude !== undefined) {
        return parseFloat(dato.GPSAltitude.toFixed(1));
      } else {
        console.error(`El dato con el nombre ${dato.name} no tiene un valor de GPSAltitude definido.`);
        return null;  // Puedes devolver null o algún valor predeterminado.
      }
    }).filter(altitud => altitud !== null);  // Filtra cualquier altitud que sea null.

    const modaAltitud = this.calcularModa(altitudes);

    datos.forEach((dato) => {
      if (dato.GPSAltitude && Math.abs(dato.GPSAltitude - modaAltitud) > 10) {
        alert(`¡Atención! La imagen con nombre ${dato.name} tiene una altitud que varía en más de 10 metros respecto a la moda.`);
      }
    });
  }


}

