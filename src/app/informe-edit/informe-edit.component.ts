import { Component, OnInit } from '@angular/core';
import { InformeService } from 'src/app/services/informe.service';
import { PlantaService } from 'src/app/services/planta.service';
import { InformeInterface } from 'src/app/models/informe';
import { PlantaInterface } from 'src/app/models/planta';
import { PcInterface } from 'src/app/models/pc';
import { ActivatedRoute, Router } from '@angular/router';
import { GLOBAL } from '../services/global';
import { take } from 'rxjs/operators';

import { AuthService } from 'src/app/services/auth.service';
import { UserInterface } from '../models/user';
import { Observable } from 'rxjs';

import { ArchivoVueloInterface } from 'src/app/models/archivoVuelo';
import { LatLngLiteral } from '@agm/core';
import { ElementoPlantaInterface } from '../models/elementoPlanta';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

export interface EventInterface {
  offsetX: number;
  offsetY: number;
}

@Component({
  selector: 'app-informe-edit',
  templateUrl: './informe-edit.component.html',
  styleUrls: ['./informe-edit.component.css'],
  providers: [InformeService, PlantaService],
})
export class InformeEditComponent implements OnInit {
  public titulo: number;
  public informe: InformeInterface;
  public planta: PlantaInterface;
  public url: string;
  public alertMessage: string;
  public DEFAULT_LAT: number;
  public DEFAULT_LNG: number;
  public mapType: string;
  public defaultZoom: number;
  public fileList: string[];

  public coords;
  public event: MouseEvent;
  public currentTrackheading: number;
  public currentImageRotation: number;
  public currentGpsCorrection: number;
  public rangeValue: number;
  public flightsData: any;
  public flightsList: string[];
  public currentFlight: string;
  // public max_temp: number;
  // public min_temp: number;
  public imageWidth: number;
  public imageHeight: number;
  public currentDatetime: number;
  public manualRotation: boolean;
  private gmtHoursDiff: number;
  public lastRef: number[];
  public currentGlobalX: number;
  public currentGlobalY: string;
  public buildingEstructura = false;
  public currentLatLng: LatLngLiteral;

  public estructuraOn: boolean;

  public filteredPcs: PcInterface[];
  public maxMarkersShow = 500;
  public user$: Observable<UserInterface>;
  public user: UserInterface;
  public pcsOrEstructuras: boolean;
  public showTable: boolean;
  public carpetaJpgGray: string;
  public planta$: Observable<PlantaInterface>;
  public gpsCoordsList: LatLngLiteral[];

  informeId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public informeService: InformeService,
    private plantaService: PlantaService,
    public auth: AuthService,
    private hotkeysService: HotkeysService
  ) {
    this.hotkeysService.add(
      new Hotkey(
        'a',
        (event: KeyboardEvent): boolean => {
          this.setImageFromRangeValue(this.rangeValue - 4);
          return false; // Prevent bubbling
        },
        undefined,
        '<---- retroceder 4 frames'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        's',
        (event: KeyboardEvent): boolean => {
          this.setImageFromRangeValue(this.rangeValue - 1);
          return false; // Prevent bubbling
        },
        undefined,
        '<- retroceder 1 frame'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'd',
        (event: KeyboardEvent): boolean => {
          this.setImageFromRangeValue(this.rangeValue + 1);
          return false; // Prevent bubbling
        },
        undefined,
        '-> avanzar 1 frame'
      )
    );
    this.hotkeysService.add(
      new Hotkey(
        'f',
        (event: KeyboardEvent): boolean => {
          this.setImageFromRangeValue(this.rangeValue + 4);
          return false; // Prevent bubbling
        },
        undefined,
        '----> avanzar 4 frames'
      )
    );
  }

  ngOnInit() {
    this.showTable = true;
    this.currentLatLng = { lat: 39.453186, lng: -5.880743 };
    this.informeId = this.route.snapshot.paramMap.get('id');

    this.rangeValue = 0;
    this.fileList = new Array();
    this.coords = new Array();

    // this.max_temp = 70;
    // this.min_temp = 41;

    this.url = GLOBAL.url;
    this.currentGpsCorrection = 0;
    this.currentFlight = '';

    this.currentTrackheading = 0;
    this.currentImageRotation = 0;

    this.imageWidth = 640;
    this.imageHeight = 512;

    this.gmtHoursDiff = 2;
    this.manualRotation = false;

    this.user$ = this.auth.user$;
    this.user$.pipe(take(1)).subscribe((user) => {
      this.user = user;
    });
    this.pcsOrEstructuras = false;
    this.getInforme();

    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      if (elementoPlanta !== null) {
        this.setElementoPlanta(elementoPlanta);
      }
    });

    this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
      this.setArchivoVuelo(archivoVuelo);
    });

    window.addEventListener('online', (e) => (this.alertMessage = undefined));
    window.addEventListener('offline', (e) => (this.alertMessage = 'ERROR Internet conection'));
  }

  setArchivoVuelo(archivoVuelo: ArchivoVueloInterface): void {
    this.changeFlight(archivoVuelo.vuelo);

    // Averiguar donde esta en fileList
    const arrayIndex = this.fileList.indexOf(archivoVuelo.archivo);
    this.rangeValue = arrayIndex + 1;

    const currentCcoords = this.coords[arrayIndex];

    // Setear this.currentLatLng (para que se extienda a todos los childs)
    this.currentLatLng = {
      lat: parseFloat(currentCcoords.Latitude),
      lng: parseFloat(currentCcoords.Longitude),
    };

    this.currentDatetime = this.getDateTimeFromDateAndTime(currentCcoords.Date, currentCcoords.Time);
    this.currentTrackheading = Math.round(currentCcoords.TrackHeading);
    this.currentImageRotation = this.getCurrentImageRotation(this.currentTrackheading);
  }

  setElementoPlanta(elementoPlanta: ElementoPlantaInterface) {
    this.setArchivoVuelo({ archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface);
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

  getPlanta(plantaId: string) {
    this.planta$ = this.plantaService.getPlanta(plantaId);
    this.plantaService.getPlanta(plantaId).subscribe(
      (planta) => {
        this.planta = planta;
        this.defaultZoom = this.planta.zoom;
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
            this.getPlanta(this.informe.plantaId);
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
            if (this.checkCorrectFileList(this.flightsData)) {
              this.flightsList = Object.keys(this.flightsData);
              this.flightsList.sort();
              this.changeFlight(this.flightsList[0]);
              this.setImageFromRangeValue(1);
              this.setCoordsList(response2);
            } else {
              this.alertMessage = 'Carpeta de vuelo incorrecta';
            }
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

  private checkCorrectFileList(flightsData): boolean {
    const flightsList = Object.keys(this.flightsData);
    const fileName = flightsData[flightsList[0]].files[0] as string;
    if (fileName.startsWith(this.informe.prefijo)) {
      return true;
    }
    return false;
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
    value = Math.max(value, 1);
    value = Math.min(value, this.fileList.length);

    // Para pasar del value del slider al indice de 'fileList' o 'coords' hay que restarle uno
    this.rangeValue = value;
    const arrayIndex = this.rangeValue - 1;

    // Comunicamos a los demás componentes que se ha cambiado el archivo
    this.informeService.selectArchivoVuelo({
      vuelo: this.currentFlight,
      archivo: this.fileList[arrayIndex],
    } as ArchivoVueloInterface);
  }

  onClickFlightsCheckbox(event) {
    if (event.target) {
      this.changeFlight(event.target.id);
      this.setImageFromRangeValue(1);
    }
  }

  changeFlight(flightName) {
    if (this.currentFlight !== flightName) {
      this.currentFlight = flightName;
      this.fileList = this.flightsData[flightName].files;
      this.coords = this.flightsData[flightName].coords;
    }
  }

  private pathJoin(parts: string[], sep = '\\') {
    const separator = sep || '\\';
    const replace = new RegExp(separator + '{1,}', 'g');
    const result = parts.join(separator).replace(replace, separator);
    return result;
  }

  onChangeCarpetaJpgGray() {
    this.informe.carpetaJpgGray = this.carpetaJpgGray;
    this.informeService.updateInforme(this.informe);
    this.getFileList();
  }

  onChangeNumGlobalCoords() {
    this.plantaService.updatePlanta(this.planta);
  }

  setCoordsList(list: any[]) {
    let gpsCoordsList = [];
    Object.keys(list).forEach((key) => {
      const coords = list[key].coords
        .map((data) => {
          return {
            altitude: data.Altitude,
            vuelo: key,
            fileName: data.FileName,
            lat: parseFloat(data.Latitude),
            lng: parseFloat(data.Longitude),
          };
        })
        .filter((item, i, array) => {
          // Esto hace mucho mas fluida la app
          return i % 10 === 0;
        });
      gpsCoordsList = gpsCoordsList.concat({ vuelo: key, coords });
    });
    this.gpsCoordsList = gpsCoordsList;
  }
}
