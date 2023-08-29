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
import VectorImageLayer from 'ol/layer/VectorImage';

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

  isHeightCorrect: boolean;
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
  segments = [];

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


  VENTANA_DESPEGUE = 10; // Número de imágenes iniciales a analizar
  UMBRAL_DESPEGUE = 30; // Diferencia de altitud acumulada que indica un posible despegue
  UMBRAL_DIFERENCIA = 5; // Diferencia de altitud entre imágenes consecutivas

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

      const output: ImageData = await exifr.parse(file, ['GPSAltitude', 'GPSLatitude', 'GPSLongitude']);
      // const output: ImageData = await exifr.parse(file);

      if (!output || !output.GPSLatitude || !output.GPSLongitude) {
        alert(`El archivo ${file.name} no contiene información de GPS. Este archivo se ignorará.`);
      } else {
        output.name = file.name;
        output.GPSLatitude = this.dmsToDecimal(output.GPSLatitude[0], output.GPSLatitude[1], output.GPSLatitude[2]);
        output.GPSLongitude = this.dmsToDecimal(output.GPSLongitude[0], output.GPSLongitude[1], output.GPSLongitude[2]);
        //const thumbnail = await exifr.thumbnail(file);
        this.imagesData.push(output);
        //this.imageThumbnails.push(this.getSanitizedUrl(thumbnail));

        let assigned = false;
        let currentSuffix = this.getSuffix(output.name);
        // console.log("Current suffix: " + currentSuffix);
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

    // console.log(this.imageGroups);


    this.imageGroups.forEach(group => {
      group.sort((a, b) => {
        const dateA = new Date(this.extractDateTimeFromName(a.name)).getTime();
        const dateB = new Date(this.extractDateTimeFromName(b.name)).getTime();



        if (dateA == dateB) {
          const numA = this.extractNumberFromName(a.name);
          const numB = this.extractNumberFromName(b.name);
          // console.log("date a: " + dateA + ", date b: " + dateB + ", num A: " + numA + ", numB: " + numB);
          return numA - numB;
        }

        return dateA - dateB;
      });
    });



    // console.log(this.imageGroups);
    this.addImageMarkersAndPolygon();

    this.segments = [];

    // console.log("image groups length: " + this.imageGroups.length)
    for (let i = 0; i < this.imageGroups.length; i++) {
      // this.verificarAltitud(this.imageGroups[i]);
      let distanciaModaGrupo = this.distanciaModa(this.imageGroups[i]);
      this.drawRouteLines(this.imageGroups[i], distanciaModaGrupo, i);
    }

    let intersectionsCounts = [];

    this.segments.forEach(segment => {
      const numIntersections = this.getNumIntersections(segment, this.segments);
      intersectionsCounts.push(numIntersections);
      // console.log(`Segment starting at ${segment[0]} and ending at ${segment[segment.length - 1]} intersects with ${numIntersections} other segments.`);
    });


    if (this.numeroImagenesRGB != this.numeroImagenesTermicas) {
      alert(`El número de imágenes RGB y térmicas NO COINCIDE. Imágenes RGB: ${this.numeroImagenesRGB}, Imágenes térmicas ${this.numeroImagenesTermicas}.`)
    } else {
      alert(`El número de imágenes RGB y térmicas SÍ COINCIDE. Imágenes RGB: ${this.numeroImagenesRGB}, Imágenes térmicas ${this.numeroImagenesTermicas}.`)

    }


    console.log("Velocidad media: " + this.velocidadMediaTotal() + " m/s");
    console.log("Velocidad moda: " + this.velocidadModaTotal() + " m/s");

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
      if (layer instanceof VectorImageLayer) {
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


      this.checkImageHeights(group);

      group.forEach((image) => {

        const lat = image.GPSLatitude;
        const lon = image.GPSLongitude;

        // console.log(image.GPSLatitude + " " + image.GPSLongitude)
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);

        const coordinates = transform([-lon, lat], 'EPSG:4326', 'EPSG:3857');
        const feature = new Feature({
          geometry: new Point(coordinates),
        });

        let iconStyle;

        if (image.isHeightCorrect) {
          if (group[0].suffix == "V") {
            iconStyle = new Style({
              image: new Icon({
                src: '../../../../../assets/icons/location-pin-dark-unhover.png',
                scale: 0.2
              }),
            });
          }

          else if (group[0].suffix == "T") {
            iconStyle = new Style({
              image: new Icon({
                src: '../../../../../assets/icons/location-pin-light-hover.png',
                scale: 0.2,
              }),
            });
          }
        } else {
          // console.log(image.name);
          iconStyle = new Style({
            image: new Icon({
              src: '../../../../../assets/icons/location-pin-hovered.png',
              scale: 0.2,
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

      const vectorLayer = new VectorImageLayer({
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
    const topeModa = distanciaModa * 2;
    this.segments = [];
    let currentSegment = [];


    for (let i = 0; i < group.length; i++) {
      if (group[i] && group[i].GPSLongitude && group[i].GPSLatitude) {

        currentSegment.push([-group[i].GPSLongitude, group[i].GPSLatitude]);

        if (currentSegment.length >= 3) {
          const lastIdx = currentSegment.length - 1;

          const angle = this.calculateAngle(
            currentSegment[lastIdx - 2],
            currentSegment[lastIdx - 1],
            currentSegment[lastIdx]
          );


          if (angle > 10) {

            this.segments.push([...currentSegment]);
            currentSegment = [currentSegment[lastIdx]];
          }
        } else {
        }
      }
    }


    if (currentSegment.length > 0) {
      this.segments.push(currentSegment);
    }

    let flagsCrossMoreThanMode = [];

    let intersectionsForMode = [];



    this.segments.forEach(segment => {
      const numIntersections = this.getNumIntersections(segment, this.segments);
      intersectionsForMode.push(numIntersections);
    });


    const mode = this.calcularModa(intersectionsForMode);
    console.log("mode: " + mode)



    this.segments.forEach(segment => {
      const numIntersections = this.getNumIntersections(segment, this.segments);
      flagsCrossMoreThanMode.push(Math.abs(numIntersections) > (mode + 3));
      console.log("Num intersections: " + numIntersections);
    });

    this.segments.forEach((segment, index) => {
      let color;
      for (let i = 1; i < segment.length; i++) {
        const coordinates = []; // Inicializar un nuevo arreglo para cada línea
        const coord1 = segment[i - 1];
        const coord2 = segment[i];
        const distancia = this.calculateDistance(coord1[1], coord1[0], coord2[1], coord2[0]) * 1000;


        if (flagsCrossMoreThanMode[index]) {
          color = 'blue';
        } else {
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
        const layer = this.map.getLayers().item(groupIndex + 1);

        if (layer instanceof VectorImageLayer || layer instanceof TileLayer) {
          const vectorSource = layer.getSource();

          vectorSource.addFeature(feature);


        }
      }
    });
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
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const hour = parseInt(match[4], 10);
      const minute = parseInt(match[5], 10);
      const second = parseInt(match[6], 10);
      return new Date(year, month, day, hour, minute, second);
    }
    return null;
  }


  getSuffix(name) {
    const regex = /_([VT])\.\w+$/;
    const match = name.match(regex);
    return match ? match[1] : null;
  }

  toggleLayers(suffix: string, isVisible: boolean) {
    this.map.getLayers().forEach(layer => {
      if (layer instanceof VectorImageLayer && layer.get("suffix") === suffix) {
        layer.setVisible(isVisible);
      }
    });
  }

  extractNumberFromName(str) {
    const regex = /.*?_.*?_(\d+)_/;
    const match = str.match(regex);

    return match ? match[1] : null;
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
        return null;
      }
    }).filter(altitud => altitud !== null);

  }


  async checkImageHeights(images: ImageData[]): Promise<void> {
    const WINDOW_SIZE = 10; // Número de imágenes iniciales para calcular la moda agrupada
    const MARGIN = 10; // Margen para agrupar valores cercanos
    const SAMPLE_SIZE = 5; // Número total de imágenes (incluyendo la actual) para tomar como muestra al comprobar altitudes posteriores

    if (images.length === 0) return;

    // Recoge las altitudes de las primeras imágenes
    const initialAltitudes: number[] = [];
    for (let i = 0; i < Math.min(WINDOW_SIZE, images.length); i++) {
      initialAltitudes.push(images[i].GPSAltitude);
    }

    const [initialLowerBound, initialUpperBound] = this.calculateGroupedModa(initialAltitudes, MARGIN);

    for (let i = 0; i < Math.min(WINDOW_SIZE, images.length); i++) {
      images[i].isHeightCorrect = images[i].GPSAltitude >= initialLowerBound && images[i].GPSAltitude <= initialUpperBound;


      if (!images[i].isHeightCorrect) {
      }
    }

    // Para las imágenes restantes
    for (let i = WINDOW_SIZE; i < images.length; i++) {
      // Recoge las altitudes de las SAMPLE_SIZE / 2 imágenes anteriores, la imagen actual y las SAMPLE_SIZE / 2 imágenes siguientes
      const sampleAltitudes: number[] = [];
      for (let j = i - Math.floor(SAMPLE_SIZE / 2); j <= i + Math.floor(SAMPLE_SIZE / 2) && j < images.length; j++) {
        if (j >= 0) { // Asegurarse de que no estamos obteniendo índices negativos
          sampleAltitudes.push(images[j].GPSAltitude);
        }
      }

      const [sampleLowerBound, sampleUpperBound] = this.calculateGroupedModa(sampleAltitudes, MARGIN);

      // Verifica si la altitud de la imagen actual está dentro del rango de la moda agrupada de la muestra
      images[i].isHeightCorrect = images[i].GPSAltitude >= sampleLowerBound && images[i].GPSAltitude <= sampleUpperBound;

      if (!images[i].isHeightCorrect) {
        console.log("image name: " + images[i].name + ", sampleLowerBound: " + sampleLowerBound + ", sampleUpperBound: " + sampleUpperBound + ", image altitude: " + images[i].GPSAltitude);
      }

    }
  }








  calculateGroupedModa(altitudes: number[], margin: number): [number, number] {
    const groupedFrequencies: { [key: string]: { count: number, total: number } } = {};

    // Asigna cada altitud a un grupo y actualiza el recuento y la suma total para ese grupo
    for (let altitude of altitudes) {
      const groupKey = Math.round(altitude / margin).toString();
      if (!groupedFrequencies[groupKey]) {
        groupedFrequencies[groupKey] = { count: 0, total: 0 };
      }
      groupedFrequencies[groupKey].count++;
      groupedFrequencies[groupKey].total += altitude;
    }

    // Identifica el grupo con mayor frecuencia
    let maxFrequency = 0;
    let groupKeyWithMaxFrequency = Object.keys(groupedFrequencies)[0];

    for (let key in groupedFrequencies) {
      if (groupedFrequencies[key].count > maxFrequency) {
        maxFrequency = groupedFrequencies[key].count;
        groupKeyWithMaxFrequency = key;
      }
    }

    // Calcula el promedio de altitud para el grupo con la mayor frecuencia
    const averageAltitude = groupedFrequencies[groupKeyWithMaxFrequency].total / groupedFrequencies[groupKeyWithMaxFrequency].count;

    return [averageAltitude - margin, averageAltitude + margin];
  }


  private calculateAngle(A: [number, number], B: [number, number], C: [number, number]): number {
    if (!A || !B || !C) return 0;  // Añade esta comprobación al inicio

    const AB = [B[0] - A[0], B[1] - A[1]];
    const BC = [C[0] - B[0], C[1] - B[1]];


    const dotProduct = AB[0] * BC[0] + AB[1] * BC[1];
    const magnitudeAB = Math.sqrt(AB[0] ** 2 + AB[1] ** 2);
    const magnitudeBC = Math.sqrt(BC[0] ** 2 + BC[1] ** 2);

    // Calcula el ángulo en grados
    const angleRad = Math.acos(dotProduct / (magnitudeAB * magnitudeBC));
    const angleDeg = angleRad * (180 / Math.PI);

    return angleDeg;
  }




  doIntersect(p1, q1, p2, q2) {
    // Define una función de utilidad para determinar la orientación
    function orientation(p, q, r) {
      const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
      if (val === 0) return 0;  // colinear
      return (val > 0) ? 1 : 2; // clock or counterclock wise
    }

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) {
      return true;
    }

    return false;
  }


  getNumIntersections(segment, allSegments) {
    let count = 0;
    const start = segment[0];
    const end = segment[segment.length - 1];

    allSegments.forEach(s => {
      const sStart = s[0];
      const sEnd = s[s.length - 1];
      if (this.doIntersect(start, end, sStart, sEnd)) {
        count++;
      }
    });

    return count - 1; // Resta 1 para excluir la intersección consigo mismo.
  }


  calcularVelocidades(grupo: ImageData[]): number[] {
    const velocidades: number[] = [];
    for (let i = 1; i < grupo.length; i++) {
      const coord1 = [grupo[i - 1].GPSLatitude, grupo[i - 1].GPSLongitude];
      const coord2 = [grupo[i].GPSLatitude, grupo[i].GPSLongitude];
      const distancia = this.calculateDistance(coord1[0], coord1[1], coord2[0], coord2[1]); // en km

      const tiempo1 = this.extractDateTimeFromName(grupo[i - 1].name);
      const tiempo2 = this.extractDateTimeFromName(grupo[i].name);
      if (!tiempo1 || !tiempo2) continue;

      const tiempo = (tiempo2.getTime() - tiempo1.getTime()) / 1000; // en segundos
      const distancia_m = distancia * 1000;
      if (distancia > 50) continue;
      if (tiempo === 0) continue;

      const velocidad = distancia_m / tiempo; // velocidad en m/s
      velocidades.push(velocidad);
    }
    return velocidades;
  }

  velocidadMedia(grupo: ImageData[]): number {
    const velocidades = this.calcularVelocidades(grupo);
    const velocidadesFiltradas = velocidades.filter(v => v > 0.1);
    const total = velocidadesFiltradas.reduce((acc, v) => acc + v, 0);
    return total / velocidadesFiltradas.length;
  }

  velocidadModa(grupo: ImageData[]): number | null {
    const velocidades = this.calcularVelocidades(grupo);
    const velocidadesFiltradas = velocidades
      .filter(v => v > 0.1)
      .map(v => parseFloat(v.toFixed(1)));

    const freqMap: { [key: number]: number } = {};
    let maxFreq = 0;
    let moda: number | null = null;

    for (let v of velocidadesFiltradas) {
      if (!freqMap[v]) freqMap[v] = 0;
      freqMap[v]++;
      if (freqMap[v] > maxFreq) {
        maxFreq = freqMap[v];
        moda = v;
      }
    }
    return moda;
  }


  calcularVelocidadesTodasImagenes(): number[] {
    // Combinar todos los grupos de imágenes en un solo array
    const allImages = this.imageGroups.flat();
    const velocidades: number[] = [];
    for (let i = 1; i < allImages.length; i++) {
      const coord1 = [allImages[i - 1].GPSLatitude, allImages[i - 1].GPSLongitude];
      const coord2 = [allImages[i].GPSLatitude, allImages[i].GPSLongitude];
      const distancia = this.calculateDistance(coord1[0], coord1[1], coord2[0], coord2[1]); // en km

      const tiempo1 = this.extractDateTimeFromName(allImages[i - 1].name);
      const tiempo2 = this.extractDateTimeFromName(allImages[i].name);
      if (!tiempo1 || !tiempo2) continue;

      const tiempo = (tiempo2.getTime() - tiempo1.getTime()) / 1000; // en segundos
      const distancia_m = distancia * 1000;
      if (distancia > 50) continue;
      if (tiempo === 0) continue;

      const velocidad = distancia_m / tiempo; // velocidad en m/s
      velocidades.push(velocidad);
    }
    return velocidades;
  }

  velocidadMediaTotal(): number {
    const velocidades = this.calcularVelocidadesTodasImagenes();
    const velocidadesFiltradas = velocidades.filter(v => v > 0.1);
    const total = velocidadesFiltradas.reduce((acc, v) => acc + v, 0);
    return total / velocidadesFiltradas.length;
  }

  velocidadModaTotal(): number | null {
    const velocidades = this.calcularVelocidadesTodasImagenes();
    const velocidadesFiltradas = velocidades
      .filter(v => v > 0.1)
      .map(v => parseFloat(v.toFixed(1)));

    const freqMap: { [key: number]: number } = {};
    let maxFreq = 0;
    let moda: number | null = null;

    for (let v of velocidadesFiltradas) {
      if (!freqMap[v]) freqMap[v] = 0;
      freqMap[v]++;
      if (freqMap[v] > maxFreq) {
        maxFreq = freqMap[v];
        moda = v;
      }
    }
    return moda;
  }


}

