import { Injectable } from '@angular/core';

import { BehaviorSubject, Subscription } from 'rxjs';

import { TileCoord } from 'ol/tilecoord';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import TileLayer from 'ol/layer/Tile';
import TileGrid from 'ol/tilegrid/TileGrid';
import { Map } from 'ol';

import { fromLonLat } from 'ol/proj';
import { LatLngLiteral } from '@agm/core';

import { fabric } from 'fabric';

import inside from 'point-in-polygon';

import { ImageProcessService } from '@data/services/image-process.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesService } from '@data/services/zones.service';

import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';

import { GLOBAL } from '@data/constants/global';

@Injectable({
  providedIn: 'root',
})
export class ImagesTilesService {
  private tileResolution = 256;
  private map: Map;
  private _imagesPlantaCompleta = {};
  imagesPlantaCompleta$ = new BehaviorSubject<{}>(this._imagesPlantaCompleta);
  private _layerInformeSelected: TileLayer = undefined;
  layerInformeSelected$ = new BehaviorSubject<TileLayer>(this._layerInformeSelected);

  private _imagesPlantaLoaded = 0;
  imagesPlantaLoaded$ = new BehaviorSubject<number>(this._imagesPlantaLoaded);

  private subscriptions: Subscription = new Subscription();

  constructor(
    private imageProcessService: ImageProcessService,
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private zonesService: ZonesService
  ) {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));
  }

  checkImgsPlanosLoaded(): Promise<boolean> {
    return new Promise((loaded) => {
      this.subscriptions.add(
        this.imagesPlantaLoaded$.subscribe((value) => {
          if (this.zonesService.thereAreZones) {
            if (this.reportControlService.plantaFija) {
              if (value === 2) {
                loaded(true);
              }
            } else {
              if (value === 1) {
                loaded(true);
              }
            }
          } else {
            loaded(true);
          }
        })
      );
    });
  }

  setImgPlanoPlanta(
    locAreas: LocationAreaInterface[],
    type: string,
    selectedInformeId: string,
    anomalias?: Anomalia[]
  ) {
    let tileCoords: TileCoord[] = [];
    const allLocAreaCoords: Coordinate[] = [];
    locAreas.forEach((locArea) => {
      const locAreaCoords = this.pathToCoordinate(locArea.path);
      allLocAreaCoords.push(...locAreaCoords);
      tileCoords.push(...this.getElemTiles(locAreaCoords, this.getElemExtent(locAreaCoords), 16));
    });
    tileCoords = this.getCompleteTiles(tileCoords);

    const canvas = new fabric.Canvas('canvas');
    const lado = Math.sqrt(tileCoords.length);
    canvas.width = lado * this.tileResolution;
    canvas.height = lado * this.tileResolution;
    const width = canvas.width / lado;
    const height = canvas.height / lado;

    let contador = 0;
    tileCoords.forEach((tileCoord, index) => {
      const url = GLOBAL.GIS + `${selectedInformeId}_${type}/${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}.png`;

      const left = (index % lado) * width;
      const top = Math.trunc(index / lado) * height;

      if (type === 'thermal') {
        const visualUrl =
          GLOBAL.GIS + `${selectedInformeId}_visual/${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}.png`;

        fabric.util.loadImage(
          visualUrl,
          (img) => {
            if (img !== null) {
              const image = new fabric.Image(img, {
                width,
                height,
                left,
                top,
                angle: 0,
                opacity: 1,
                draggable: false,
                lockMovementX: true,
                lockMovementY: true,
                scaleX: 1,
                scaleY: 1,
              });

              canvas.add(image);
              // movemos al fondo para que quede debajo de la termica
              canvas.moveTo(image, 0);

              contador++;
              if (contador === tileCoords.length * 2) {
                this.createFinalImage(tileCoords, lado, allLocAreaCoords, anomalias, canvas, type);
              }
            } else {
              contador++;
              if (contador === tileCoords.length * 2) {
                this.createFinalImage(tileCoords, lado, allLocAreaCoords, anomalias, canvas, type);
              }
            }
          },
          null,
          { crossOrigin: 'anonymous' }
        );

        fabric.util.loadImage(
          url,
          (img) => {
            if (img !== null) {
              img = this.imageProcessService.transformPixels(img, selectedInformeId);

              const image = new fabric.Image(img, {
                width,
                height,
                left,
                top,
                angle: 0,
                opacity: 1,
                draggable: false,
                lockMovementX: true,
                lockMovementY: true,
                scaleX: 1,
                scaleY: 1,
              });

              canvas.add(image);

              contador++;
              if (contador === tileCoords.length * 2) {
                this.createFinalImage(tileCoords, lado, allLocAreaCoords, anomalias, canvas, type);
              }
            } else {
              contador++;
              if (contador === tileCoords.length * 2) {
                this.createFinalImage(tileCoords, lado, allLocAreaCoords, anomalias, canvas, type);
              }
            }
          },
          null,
          { crossOrigin: 'anonymous' }
        );
      } else {
        fabric.util.loadImage(
          url,
          (img) => {
            if (img !== null) {
              if (type === 'thermal') {
                img = this.imageProcessService.transformPixels(img, selectedInformeId);
              }

              const image = new fabric.Image(img, {
                width,
                height,
                left,
                top,
                angle: 0,
                opacity: 1,
                draggable: false,
                lockMovementX: true,
                lockMovementY: true,
                scaleX: 1,
                scaleY: 1,
              });

              canvas.add(image);

              contador++;
              if (contador === tileCoords.length) {
                this.createFinalImage(tileCoords, lado, allLocAreaCoords, anomalias, canvas, type);
              }
            } else {
              contador++;
              if (contador === tileCoords.length) {
                this.createFinalImage(tileCoords, lado, allLocAreaCoords, anomalias, canvas, type);
              }
            }
          },
          null,
          { crossOrigin: 'anonymous' }
        );
      }
    });
  }

  getElemTiles(coords: Coordinate[], extents: Extent[], zoomLevel: number): TileCoord[] {
    // obtenemos los tileCoords de cada coordenada
    let tilesCoord: TileCoord[] = [];

    this.layerInformeSelected = this.map.getLayers().getArray()[0] as TileLayer;

    const source = this.layerInformeSelected.getSource();
    const tileGrid = source.getTileGrid();
    extents.forEach((extent, index) => {
      tileGrid.forEachTileCoord(extent, zoomLevel, (tileCoord) => {
        const longLatCoords = this.getLongLatFromXYZ(tileCoord, tileGrid);
        if (inside(coords[index], longLatCoords)) {
          tilesCoord.push(tileCoord);
        }
      });
    });

    // obtenemos todos los tiles descartando duplicados
    tilesCoord = this.getCompleteTiles(tilesCoord);

    return tilesCoord;
  }

  getLongLatFromXYZ(tileCoord: TileCoord, tileGrid: TileGrid) {
    const z = tileCoord[0];
    const x = tileCoord[1];
    const y = tileCoord[2];
    const tileGridOrigin = tileGrid.getOrigin(z);
    const tileSizeAtResolution = Number(tileGrid.getTileSize(z)) * tileGrid.getResolution(z);

    const bottomLeft = [
      tileGridOrigin[0] + tileSizeAtResolution * x,
      tileGridOrigin[1] - tileSizeAtResolution * (y + 1),
    ];
    const topLeft = [tileGridOrigin[0] + tileSizeAtResolution * x, tileGridOrigin[1] - tileSizeAtResolution * y];
    const topRight = [tileGridOrigin[0] + tileSizeAtResolution * (x + 1), tileGridOrigin[1] - tileSizeAtResolution * y];
    const bottomRight = [
      tileGridOrigin[0] + tileSizeAtResolution * (x + 1),
      tileGridOrigin[1] - tileSizeAtResolution * (y + 1),
    ];

    return [bottomLeft, topLeft, topRight, bottomRight];
  }

  getElemExtent(coords: Coordinate[]): Extent[] {
    const range = 0.001;
    const extents: Extent[] = [];
    coords.forEach((coord) => {
      const extent: Extent = [coord[0] - range, coord[1] - range, coord[0] + range, coord[1] + range];
      extents.push(extent);
    });

    return extents;
  }

  private getCompleteTiles(tilesCoord: TileCoord[]): TileCoord[] {
    const tilesCoordCompletes: TileCoord[] = [];

    const coordsX = tilesCoord.map((coord) => coord[1]);
    const coordsY = tilesCoord.map((coord) => coord[2]);
    // obtenemos los maximos y le sumamos una para traernos los de alrededor
    const minX = Math.min(...coordsX) - 1;
    let maxX = Math.max(...coordsX) + 1;
    const minY = Math.min(...coordsY) - 1;
    let maxY = Math.max(...coordsY) + 1;

    // hacemos el grupo cuadrado con lado el que sea mayor de X o Y
    const rangoX = maxX - minX;
    const rangoY = maxY - minY;
    const diferencia = rangoY - rangoX;
    if (diferencia > 0) {
      maxX += diferencia;
    } else if (diferencia < 0) {
      maxY += Math.abs(diferencia);
    }

    for (let j = minY; j <= maxY; j++) {
      for (let i = minX; i <= maxX; i++) {
        const coord = [tilesCoord[0][0], i, j];
        tilesCoordCompletes.push(coord);
      }
    }

    return tilesCoordCompletes;
  }

  private createFinalImage(
    tileCoords: TileCoord[],
    lado: number,
    allLocAreaCoords: Coordinate[],
    anomalias: Anomalia[],
    canvas: any,
    type: string
  ) {
    const tileGrid = this.layerInformeSelected.getSource().getTileGrid();
    const longLatOrigen = this.getLongLatFromXYZ(tileCoords[0], tileGrid);
    const longLatFin = this.getLongLatFromXYZ(tileCoords[tileCoords.length - 1], tileGrid);
    const coordsSegCanvas = this.getCoordsPolygonCanvas(longLatOrigen, longLatFin, allLocAreaCoords, lado);

    if (type === 'thermal' && anomalias !== undefined) {
      this.drawAnomaliasPlanta(anomalias, canvas, longLatOrigen, longLatFin, lado);
    }

    this.canvasCenterAndZoom(coordsSegCanvas, canvas);

    this.imagesPlantaCompleta[type] = canvas.toDataURL({
      format: 'png',
    });

    this.imagesPlantaLoaded++;
  }

  private getCoordsPolygonCanvas(
    coordsTileOrigen: number[][],
    coordsTileFin: number[][],
    polygonCoords: Coordinate[],
    lado: number
  ) {
    const topLeft = coordsTileOrigen[1];
    const bottomRight = coordsTileFin[3];
    const longsOrdered = polygonCoords.map((coord) => coord[0]).sort((a, b) => a - b);

    const leftLongitude = longsOrdered[0];
    const rightLongitude = longsOrdered[longsOrdered.length - 1];

    const latsOrdered = polygonCoords.map((coord) => coord[1]).sort((a, b) => a - b);

    const topLatitude = latsOrdered[latsOrdered.length - 1];
    const bottomLatitude = latsOrdered[0];

    const polygonLeft = ((leftLongitude - topLeft[0]) * (this.tileResolution * lado)) / (bottomRight[0] - topLeft[0]);
    const polygonRight = ((rightLongitude - topLeft[0]) * (this.tileResolution * lado)) / (bottomRight[0] - topLeft[0]);
    const polygonTop =
      (Math.abs(topLatitude - topLeft[1]) * (this.tileResolution * lado)) / Math.abs(bottomRight[1] - topLeft[1]);
    const polygonBottom =
      ((bottomLatitude - topLeft[1]) * (this.tileResolution * lado)) / (bottomRight[1] - topLeft[1]);
    const width = Math.abs(polygonRight - polygonLeft);
    const height = Math.abs(polygonBottom - polygonTop);

    return [polygonLeft, polygonTop, width, height];
  }

  private drawAnomaliasPlanta(
    anomalias: Anomalia[],
    canvas: any,
    coordsOrigen: number[][],
    coordsFin: number[][],
    lado: number
  ): void {
    anomalias.forEach((anom, index) => {
      const coordsAnomCanvas = this.getCoordsPolygonCanvas(coordsOrigen, coordsFin, anom.featureCoords, lado);
      this.drawPolygonInCanvas(anom.localId, canvas, coordsAnomCanvas, undefined, 4);
    });
  }

  drawPolygonInCanvas(id: string, canvas: any, coordsPolygonCanvas: number[], index?: number, strokeAnomalia?: number) {
    let strokeWidth = 2;
    let rx = 4;
    let ry = 4;
    if (strokeAnomalia !== undefined) {
      strokeWidth = strokeAnomalia;
      rx = 0;
      ry = 0;
    }
    const polygon = new fabric.Rect({
      left: coordsPolygonCanvas[0],
      top: coordsPolygonCanvas[1],
      fill: 'rgba(0,0,0,0)',
      stroke: 'white',
      strokeWidth,
      width: coordsPolygonCanvas[2],
      height: coordsPolygonCanvas[3],
      hasControls: false,
      lockMovementY: true,
      lockMovementX: true,
      anomId: id,
      ref: 'anom',
      selectable: false,
      hoverCursor: 'pointer',
      rx,
      ry,
    });

    canvas.add(polygon);

    if (index !== undefined) {
      const label = new fabric.Text(index.toString(), {
        left: coordsPolygonCanvas[0],
        top: coordsPolygonCanvas[1] - 26,
        fontSize: 20,
        // textBackgroundColor: 'red',
        ref: 'text',
        selectable: false,
        hoverCursor: 'default',
        fill: 'white',
      });

      canvas.add(label);
    }

    canvas.renderAll();
  }

  canvasCenterAndZoom(coordsPolygon: number[], canvas: any, trim?: boolean) {
    const longestSide = Math.max(coordsPolygon[2], coordsPolygon[3]);
    const polygonCentroid = [coordsPolygon[0] + coordsPolygon[2] / 2, coordsPolygon[1] + coordsPolygon[3] / 2];
    const zoom = canvas.getWidth() / (longestSide + 120);

    // VERDINALES
    let desviacion = 1;
    // if (trim) {
    //   desviacion = 0.85;
    // }

    canvas.setZoom(1); // reset zoom so pan actions work as expected
    const vpw = canvas.width / zoom;
    const vph = canvas.height / zoom;
    const x = (polygonCentroid[0] - vpw / 2) * desviacion; // x is the location where the top left of the viewport should be
    const y = polygonCentroid[1] - vph / 2; // y idem
    canvas.absolutePan({ x, y });
    canvas.setZoom(zoom);

    // VERDINALES
    if (trim) {
      const left = (canvas.getWidth() / 2) * 0.75;
      const width = (canvas.getWidth() / 2 - left) * 2;
      canvas.clipTo = (ctx) => {
        ctx.rect(left, 0, width, canvas.getWidth());
      };
    }

    canvas.renderAll();
  }

  pathToCoordinate(path: LatLngLiteral[]): Coordinate[] {
    const coordenadas: Coordinate[] = [];
    path.forEach((coord) => {
      const coordenada: Coordinate = fromLonLat([coord.lng, coord.lat]);
      coordenadas.push(coordenada);
    });
    return coordenadas;
  }

  resetService() {
    this.map = undefined;
    this.imagesPlantaCompleta = {};
    this.layerInformeSelected = undefined;
    this.imagesPlantaLoaded = 0;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  get imagesPlantaCompleta() {
    return this._imagesPlantaCompleta;
  }

  set imagesPlantaCompleta(value) {
    this._imagesPlantaCompleta = value;
    this.imagesPlantaCompleta$.next(value);
  }

  get imagesPlantaLoaded() {
    return this._imagesPlantaLoaded;
  }

  set imagesPlantaLoaded(value: number) {
    this._imagesPlantaLoaded = value;
    this.imagesPlantaLoaded$.next(value);
  }

  get layerInformeSelected() {
    return this._layerInformeSelected;
  }

  set layerInformeSelected(value: TileLayer) {
    this._layerInformeSelected = value;
    this.layerInformeSelected$.next(value);
  }
}
