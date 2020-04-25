import { Component, OnInit, ViewChild } from '@angular/core';
import { InformeService } from 'src/app/services/informe.service';
import { PcService } from 'src/app/services/pc.service';
import { PlantaService } from 'src/app/services/planta.service';
import { InformeInterface } from 'src/app/models/informe';
import { PlantaInterface } from 'src/app/models/planta';
import { PcInterface } from 'src/app/models/pc';
import { ActivatedRoute, Router } from '@angular/router';
import { GLOBAL } from '../../services/global';
import { take, map } from 'rxjs/operators';
import { EstructuraInterface } from '../../models/estructura';

import { AuthService } from 'src/app/services/auth.service';
import { UserInterface } from '../../models/user';
import { Observable } from 'rxjs';

import { ArchivoVueloInterface } from 'src/app/models/archivoVuelo';
import { LatLngLiteral } from '@agm/core';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';

export interface EventInterface {
  offsetX: number;
  offsetY: number;
}

@Component({
  selector: 'app-informe-edit',
  templateUrl: './informe-edit.component.html',
  styleUrls: ['./informe-edit.component.css'],
  providers: [InformeService, PlantaService, PcService],
})
export class InformeEditComponent implements OnInit {
  public titulo: number;
  public informe: InformeInterface;
  public planta: PlantaInterface;
  public allPcs: PcInterface[];
  public url: string;
  public alertMessage: string;
  public DEFAULT_LAT: number;
  public DEFAULT_LNG: number;
  public mapType: string;
  public defaultZoom: number;
  public fileList: string[];
  public canvas;
  public squareBase;
  public squareProp;
  public squareHeight;
  public squareWidth;
  public localIdCount: number;
  public oldTriangle;
  public oldTriangle2;
  public coords;
  public event: MouseEvent;
  public currentArchivoVuelo: ArchivoVueloInterface;
  public currentTrackheading: number;
  public currentImageRotation: number;
  public currentGpsCorrection: number;
  public rangeValue: number;
  public selected_pc: PcInterface;
  public flightsData: any;
  public flightsList: string[];
  public currentFlight: string;
  public columnas_array: number[];
  public filas_array: number[];
  public max_temp: number;
  public min_temp: number;
  public imageWidth: number;
  public imageHeight: number;
  public currentDatetime: number;
  public manualRotation: boolean;
  private gmtHoursDiff: number;
  public lastRef: number[];
  public currentGlobalX: number;
  public currentGlobalY: string;
  public estructura: EstructuraInterface;
  public buildingEstructura = false;
  public currentLatLng: LatLngLiteral;

  public estructuraOn: boolean;

  public rectSeparation = 0.1;
  public filteredPcs: PcInterface[];
  public maxMarkersShow = 500;
  public user$: Observable<UserInterface>;
  public user: UserInterface;
  public pcsOrEstructuras: boolean;
  public carpetaJpgGray: string;
  public planta$: Observable<PlantaInterface>;

  informeId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private pcService: PcService,
    public auth: AuthService
  ) {
    this.currentLatLng = { lat: 39.453186, lng: -5.880743 };
    this.informeId = this.route.snapshot.paramMap.get('id');

    this.localIdCount = 0;
    this.rangeValue = 0;
    this.fileList = new Array();
    this.coords = new Array();

    // this.max_temp = 70;
    // this.min_temp = 41;

    this.url = GLOBAL.url;
    this.currentGpsCorrection = 0;
    this.currentFlight = 'DJI_0001';

    this.currentTrackheading = 0;
    this.currentImageRotation = 0;
    this.squareBase = 37;
    this.squareProp = 1.8;

    this.imageWidth = 640;
    this.imageHeight = 512;

    this.gmtHoursDiff = 2;
    this.manualRotation = false;

    this.allPcs = new Array<PcInterface>();
  }

  ngOnInit() {
    this.user$ = this.auth.user$;
    this.user$.pipe(take(1)).subscribe((user) => {
      this.user = user;
    });
    this.pcsOrEstructuras = false;
    this.getInforme();

    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      this.setElementoPlanta(elementoPlanta);
    });

    this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
      if (this.currentArchivoVuelo !== archivoVuelo) {
        this.setArchivoVuelo(archivoVuelo);
      }
    });
  }

  setArchivoVuelo(archivoVuelo: ArchivoVueloInterface): void {
    this.currentArchivoVuelo = archivoVuelo;
    this.changeFlight(archivoVuelo.vuelo);

    // Averiguar donde esta en fileList
    const arrayIndex = this.fileList.indexOf(archivoVuelo.archivo);
    this.rangeValue = arrayIndex + 1;

    const coords = this.coords[arrayIndex];
    // Setear this.currentLatLng (para que se extienda a todos los childs)
    this.currentLatLng = {
      lat: parseFloat(coords.Latitude),
      lng: parseFloat(coords.Longitude),
    };

    this.currentDatetime = this.getDateTimeFromDateAndTime(this.coords[arrayIndex].Date, this.coords[arrayIndex].Time);
    this.currentTrackheading = Math.round(this.coords[arrayIndex].TrackHeading);
    this.currentImageRotation = this.getCurrentImageRotation(this.currentTrackheading);
  }

  setElementoPlanta(elementoPlanta: ElementoPlantaInterface) {
    this.setArchivoVuelo({ archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface);
  }

  onObjectModified(event) {
    // const actObj = this.canvas.getActiveObject();
    const actObj = event.target;

    // Get HS img coords and draw triangle
    if (actObj !== null && actObj !== undefined) {
      if (actObj.get('type') === 'rect' && actObj.isMoving === true) {
        const actObjRaw = this.transformActObjToRaw(actObj);
        // const max_temp = this.getMaxTempInActObj(actObj);
        // this.selected_pc.temperaturaMax = max_temp.max_temp;
        // this.selected_pc.img_x = max_temp.max_temp_x;
        // this.selected_pc.img_y = max_temp.max_temp_y;
        if (actObjRaw.ref === true) {
          this.selected_pc.refTop = Math.round(actObjRaw.top);
          this.selected_pc.refLeft = Math.round(actObjRaw.left);
          this.selected_pc.refWidth = Math.round(Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x));
          this.selected_pc.refHeight = Math.round(Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y));
        } else {
          this.selected_pc.img_top = Math.round(actObjRaw.top);
          this.selected_pc.img_left = Math.round(actObjRaw.left);
          this.selected_pc.img_width = Math.round(Math.abs(actObjRaw.aCoords.tl.x - actObjRaw.aCoords.tr.x));
          this.selected_pc.img_height = Math.round(Math.abs(actObjRaw.aCoords.tl.y - actObjRaw.aCoords.bl.y));
        }
      }
    }
  }

  getCurrentImageRotation(trackHeading: number) {
    // track_heading: en grados
    // return: angulo de rotacion, sentido horario positivo
    if (this.manualRotation) {
      return this.currentImageRotation;
    }

    if (trackHeading >= 45 && trackHeading < 135) {
      return 90;
    } else if (trackHeading >= 135 && trackHeading < 225) {
      return 180;
    } else if (trackHeading >= 225 && trackHeading < 315) {
      return 270; // -90 º || 270 º
    } else {
      return 0;
    }
  }

  transformCoordsToRotated(x: number, y: number) {
    // current image rotation en grados
    let x1: number;
    let y1: number;

    if (this.currentImageRotation === 90) {
      x1 = this.imageHeight - y;
      y1 = x;
    } else if (this.currentImageRotation === 180) {
      x1 = this.imageWidth - x;
      y1 = this.imageHeight - y;
    } else if (this.currentImageRotation === 270 || this.currentImageRotation === -90) {
      x1 = y;
      y1 = this.imageWidth - x;
    } else {
      x1 = x;
      y1 = y;
    }

    return { x: x1, y: y1 };
  }

  transformCoordsToRaw(x0: number, y0: number) {
    // current image rotation en grados
    // let x = Math.round(x_ * Math.cos(Math.PI / 180 * this.current_image_rotation)
    //         + y_ * Math.sin(Math.PI / 180 * this.current_image_rotation));
    // let y = Math.round(- x_ * Math.sin(Math.PI / 180 * this.current_image_rotation)
    //         + y_ * Math.cos(Math.PI / 180 * this.current_image_rotation));
    let x: number;
    let y: number;

    // Los angulos de rotacion son positivos en sentido horario
    if (this.currentImageRotation === 270 || this.currentImageRotation === -90) {
      x = this.imageWidth - y0;
      y = x0;
    } else if (this.currentImageRotation === 180) {
      x = this.imageWidth - x0;
      y = this.imageHeight - y0;
    } else if (this.currentImageRotation === 90) {
      x = y0;
      y = this.imageHeight - x0;
    } else {
      x = x0;
      y = y0;
    }
    return { x, y };
  }

  transformActObjToRaw(actObj) {
    let left: number;
    let top: number;
    let width: number;
    let height: number;

    // Los angulos de rotacion son positivos en sentido horario
    if (this.currentImageRotation === 270 || this.currentImageRotation === -90) {
      left = this.imageWidth - actObj.top - actObj.height;
      top = actObj.left;
      width = actObj.height;
      height = actObj.width;
    } else if (this.currentImageRotation === 180) {
      left = this.imageWidth - actObj.left - actObj.width;
      top = this.imageHeight - actObj.top - actObj.height;
      width = actObj.width;
      height = actObj.height;
    } else if (this.currentImageRotation === 90) {
      left = actObj.top;
      top = this.imageHeight - actObj.left - actObj.height;
      width = actObj.height;
      height = actObj.width;
    } else {
      left = actObj.left;
      top = actObj.top;
      width = actObj.width;
      height = actObj.height;
    }
    actObj.left = left;
    actObj.top = top;
    actObj.width = width;
    actObj.height = height;

    return actObj;
  }

  onMouseMoveCanvas(event: MouseEvent) {}

  getLocalCoordsFromEstructura(columna, fila, estructura) {
    let columnaReal = columna;
    let filaReal = fila;

    if (estructura.hasOwnProperty('sentido')) {
      columnaReal = estructura.sentido ? estructura.columnas - columna + 1 : columna;
    }
    if (this.estructura.hasOwnProperty('columnaInicio')) {
      columnaReal = columnaReal + estructura.columnaInicio - 1;
    }
    if (this.estructura.hasOwnProperty('filaInicio')) {
      filaReal = filaReal + estructura.filaInicio - 1;
    }

    return [columnaReal, filaReal];
  }

  // setSeguidor() {
  //   // TODO: fix this
  //   let event: EventInterface = {
  //     offsetX: Math.round(this.image_width / 2),
  //     offsetY: Math.round(this.image_height / 2),
  //   };

  // this.onDblClickCanvas(event);
  // }

  // rgb2temp(red, green, blue) {
  //   // a = (max_temp - min_temp) / 255
  //   // b= min_temp
  //   // const max_temp = this.max_temp;
  //   // const min_temp = this.min_temp;

  //   const b = min_temp;
  //   const a = (max_temp - min_temp) / 255;

  //   const x = (red + green + blue) / 3;
  //   return Math.round((x * a + b) * 10) / 10;
  // }

  indexOfMax(arr) {
    if (arr.length === 0) {
      return -1;
    }

    let maxValue = arr[0];
    let maxIndex = 0;

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > maxValue) {
        maxIndex = i;
        maxValue = arr[i];
      }
    }
    return [maxValue, maxIndex];
  }

  setSquareBase(squareBase: number) {
    this.squareBase = squareBase;
    if (this.planta.vertical) {
      // vertical
      this.squareWidth = this.squareBase;
      this.squareHeight = Math.round(this.squareWidth * this.squareProp);
    } else {
      // horizontal
      this.squareHeight = this.squareBase;
      this.squareWidth = Math.round(this.squareHeight * this.squareProp);
    }
  }

  getPlanta(plantaId: string) {
    this.planta$ = this.plantaService.getPlanta(plantaId);
    this.plantaService.getPlanta(plantaId).subscribe(
      (response) => {
        this.planta = response;
        this.defaultZoom = this.planta.zoom;

        this.filas_array = [];
        this.columnas_array = [];
        for (let i = 1; i <= this.planta.columnas; i++) {
          this.columnas_array.push(i);
        }
        for (let i = 1; i <= this.planta.filas; i++) {
          this.filas_array.push(i);
        }

        this.setSquareBase(this.squareBase);
      },
      (error) => {
        const errorMessage = error as any;
        if (errorMessage != null) {
          const body = JSON.parse(error._body);
          this.alertMessage = body.message;

          console.log(error);
        }
      }
    );
  }

  getInforme() {
    // this.route.params.forEach((params: Params) => {
    //   const id = params['id'];

    this.informeService
      .getInforme(this.informeId)
      .pipe(take(1))
      .subscribe(
        (response) => {
          if (!response) {
            this.router.navigate(['/']);
            console.log('errorrr 1');
          } else {
            this.informe = response;
            if (this.informe.hasOwnProperty('carpetaJpgGray')) {
              this.carpetaJpgGray = this.informe.carpetaJpgGray;
            } else {
              this.carpetaJpgGray = this.pathJoin([this.informe.carpetaBase, GLOBAL.carpetaJpgGray]);
            }
            // this.min_temp = this.informe.tempMin;
            // this.max_temp = this.informe.tempMax;

            this.getPlanta(this.informe.plantaId);
            // Cogemos todos los pcs de esta informe
            this.getPcsList();
            // this.getEstructurasList();
            this.titulo = this.informe.fecha * 1000;
            // Obtener lista de imagenes de la carpeta
            this.getFileList();
          }
        },
        (error) => {
          const errorMessage = error;
          if (errorMessage != null) {
            const body = JSON.parse(error._body);
            this.alertMessage = body.message;

            console.log(error);
          }
        }
      );
  }

  private getFileList() {
    this.informeService
      .getFileList(this.carpetaJpgGray)
      .pipe(take(1))
      .subscribe(
        (response2) => {
          if (!response2) {
            this.alertMessage = 'No hay archivos';
          } else {
            this.flightsData = response2;
            this.flightsList = Object.keys(this.flightsData);
            this.flightsList.sort();

            this.changeFlight(this.flightsList[0]);
            this.setImageFromRangeValue(1);
            // this.getEstructurasList();
          }
        },
        (error) => {
          const errorMessage = error;
          if (errorMessage != null) {
            const body = JSON.parse(error._body);
            this.alertMessage = body.message;
            console.log(error);
          }
        }
      );
  }

  sortPcs(array: PcInterface[]) {
    array.sort((a: PcInterface, b: PcInterface) => {
      if (a.local_id > b.local_id) {
        return -1;
      } else {
        return 1;
      }
    });
    return array;
  }

  filterPcsByFlight(currentFlight: string): PcInterface[] {
    if (!this.pcsOrEstructuras) {
      return null;
    }
    if (typeof this.allPcs !== 'undefined') {
      const filteredPcs = this.sortPcs(this.allPcs.filter((x) => x.vuelo === currentFlight));

      return filteredPcs.slice(0, this.maxMarkersShow);
    }
  }

  // getEstructurasList() {
  //   this.informeService
  //     .getAllEstructuras(this.informe.id)
  //     .pipe(take(1))
  //     .subscribe((estArray) => {
  // estArray.map((est) => {
  // if (!est.hasOwnProperty('latitud') || !est.hasOwnProperty('longitud')) {
  //   const gpsCoords = this.getGpsFromFilename(est.archivo);
  //   est.latitud = gpsCoords.lat;
  //   est.longitud = gpsCoords.lng;
  // }
  // if (!est.hasOwnProperty('vuelo')) {
  //   est.vuelo = this.getFlightFromFilename(est.archivo);
  // }
  // Hace que se ralentice muchisimo la carga:

  //   return est;
  // });

  //       this.dataSourceEst.data = estArray;
  //     });
  // }

  getPcsList(vuelo?: string) {
    this.pcService
      .getPcsInformeEdit(this.informe.id)
      .pipe(
        take(1),
        map((pcList) => {
          pcList.map((pc) => {
            pc.color = 'black';
            return pc;
          });
          return pcList;
        })
      )
      .subscribe(
        (response) => {
          if (!response || response.length === 0) {
            this.alertMessage = 'No hay puntos calientes';
          } else {
            this.alertMessage = null;
            this.allPcs = response;
            if (vuelo != null) {
              this.allPcs = this.sortPcs(this.allPcs).filter((arr) => {
                return arr.vuelo === vuelo;
              });
            } else {
              this.allPcs = this.sortPcs(this.allPcs);
            }

            this.localIdCount = this.allPcs[0].local_id;
          }

          // if (this.DEFAULT_LAT == null || this.DEFAULT_LNG == null) {
          //     this.DEFAULT_LAT = this.allPcs[0].gps_lat;
          //     this.DEFAULT_LNG = this.allPcs[0].gps_lng;
          // }
        },
        (error) => {
          const errorMessage = error;
          if (errorMessage != null) {
            const body = JSON.parse(error._body);
            this.alertMessage = body.message;
            console.log(error);
          }
        }
      );
  }

  addPcToDb(pc: PcInterface) {
    this.pcService.addPc(pc);
    this.allPcs.push(pc);
    this.allPcs = this.sortPcs(this.allPcs);
    this.selected_pc = pc;
  }

  // onInputRange(event) {
  //   this.selected_pc = null;
  //   this.setImageFromRangeValue(parseInt(event.target.value, 10));
  // }

  private getDateTimeFromDateAndTime(date: string, time: string) {
    const dateSplitted = date.split('.');
    const year = parseInt(dateSplitted[2], 10);
    const month = parseInt(dateSplitted[1], 10);
    const day = parseInt(dateSplitted[0], 10);

    const timeSplitted = time.split(':');
    const hours = parseInt(timeSplitted[0], 10);
    const minutes = parseInt(timeSplitted[1], 10);
    const seconds = parseInt(timeSplitted[2], 10);

    return new Date(year, month - 1, day, hours + this.gmtHoursDiff, minutes, seconds).getTime() / 1000;
  }

  private getFlightFromFilename(filename: string): string {
    return 'DJI_'.concat(filename.split('_')[3]);
  }

  getGpsFromFilename(archivo: string) {
    const currentFlight = this.getFlightFromFilename(archivo);
    const fileList = this.flightsData[currentFlight].files;
    const coords = this.flightsData[currentFlight].coords;
    const arrayIndex = fileList.indexOf(archivo);
    return { lat: parseFloat(coords[arrayIndex].Latitude), lng: parseFloat(coords[arrayIndex].Longitude) };
  }

  setImageFromRangeValue(value) {
    // El input es el 'value' del slider
    value = parseInt(value, 10);

    // Para pasar del value del slider al indice de 'fileList' o 'coords' hay que restarle uno
    this.rangeValue = value;
    const arrayIndex = this.rangeValue - 1;

    // Comunicamos a los demás componentes que se ha cambiado el archivo
    this.informeService.selectArchivoVuelo({
      vuelo: this.currentFlight,
      archivo: this.fileList[arrayIndex],
    } as ArchivoVueloInterface);
  }

  onClickDeletePc(pc: PcInterface) {
    // Eliminamos el PC de la bbdd
    this.delPcFromDb(pc);

    // Eliminamos el cuadrado
    this.selected_pc = null;
    // Eliminamos el triangulo
    if (this.oldTriangle !== null && this.oldTriangle !== undefined) {
      this.canvas.remove(this.oldTriangle);
    }

    // Eliminamos el pc del canvas
    this.canvas.getObjects().forEach((object) => {
      if (object.local_id === pc.local_id) {
        this.canvas.remove(object);
      }
    });

    // Elimminamos el pc de la lista
    const index: number = this.allPcs.indexOf(pc);
    if (index !== -1) {
      this.allPcs.splice(index, 1);
    }
  }

  delPcFromDb(pc: PcInterface) {
    this.pcService.delPc(pc);
  }

  updateLocalAreaInPc(pc, globalX, globalY, modulo) {
    if (globalX.length > 0) {
      pc.global_x = globalX;
    }
    if (globalY.length > 0) {
      pc.global_y = globalY;
    }

    if (Object.entries(modulo).length > 0 && modulo.constructor === Object) {
      pc.modulo = modulo;
    }

    // pc.datetime = this.current_datetime;

    this.updatePcInDb(pc);
  }

  onClickLocalCoordsTable(selectedPc: PcInterface, f: number, c: number) {
    if (this.selected_pc === selectedPc) {
      if (this.planta.tipo !== 'fija') {
        this.selected_pc.local_x = c;
        this.selected_pc.local_y = f;
      } else {
        this.selected_pc.local_y = f;
      }
    }
    this.updatePcInDb(selectedPc);
  }

  updatePcInDb(pc: PcInterface) {
    this.pcService.updatePc(pc);

    // Actualizar this.allPcs
    this.allPcs = this.allPcs.map((element) => {
      if (pc.id === element.id) {
        return pc;
      } else {
        return element;
      }
    });
  }

  onClickFlightsCheckbox(event) {
    if (event.target) {
      this.changeFlight(event.target.id);
      this.setImageFromRangeValue(1);
    }
  }

  changeFlight(flightName) {
    this.currentFlight = flightName;
    this.fileList = this.flightsData[flightName].files;
    this.coords = this.flightsData[flightName].coords;
  }

  private pathJoin(parts: string[], sep = '\\') {
    const separator = sep || '\\';
    const replace = new RegExp(separator + '{1,}', 'g');
    const result = parts.join(separator).replace(replace, separator);
    return result;
  }

  onChangeCarpetaJpgGray(event) {
    this.informe.carpetaJpgGray = this.carpetaJpgGray;
    this.informeService.updateInforme(this.informe);
    this.getFileList();
  }
}
