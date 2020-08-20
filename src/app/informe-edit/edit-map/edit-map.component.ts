import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { AgmMap, LatLngLiteral, LatLng } from '@agm/core';
import { PcInterface } from 'src/app/models/pc';
import { Estructura } from '../../models/estructura';
import { InformeService } from '../../services/informe.service';
import { PlantaService } from '../../services/planta.service';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';
import { ValidateElementoPlantaPipe } from '../../pipes/validate-elemento-planta.pipe';
import { take, switchMap } from 'rxjs/operators';
import { LocationAreaInterface } from 'src/app/models/location';
import { PlantaInterface } from 'src/app/models/planta';
declare const google: any;

@Component({
  selector: 'app-edit-map',
  templateUrl: './edit-map.component.html',
  styleUrls: ['./edit-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditMapComponent implements OnInit {
  @ViewChild(AgmMap) map: any;
  @Input() set gpsCoordsList(list: any) {
    this.coordsList = list;
  }

  mapType: string;
  defaultZoom: number;
  allElementosPlanta: ElementoPlantaInterface[];
  polygonList: any[];
  informeId: string;
  planta: PlantaInterface;
  coordsList: LatLngLiteral[];
  colorSameFlight: string;
  colorOtherFlight: string;
  soloEstructurasVuelo: boolean;
  droneLatLng: LatLngLiteral;
  droneCircle: any;
  estDrawedInMap: any[];
  selectedEstructura: ElementoPlantaInterface;

  constructor(
    private route: ActivatedRoute,
    public informeService: InformeService,
    private plantaService: PlantaService,
    private validateElem: ValidateElementoPlantaPipe
  ) {}

  ngOnInit() {
    this.informeService.droneLatLng$.subscribe((latLng) => {
      this.droneLatLng = latLng;
      this.drawDroneLatLngCircle(latLng);
    });
    this.estDrawedInMap = [];
    this.mapType = 'satellite';
    this.colorSameFlight = 'white';
    this.colorOtherFlight = 'aqua';
    this.defaultZoom = 18;
    this.droneLatLng = { lat: 39.453186, lng: -5.880743 };
    this.polygonList = [];
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.soloEstructurasVuelo = false;

    // this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
    // });

    const obsEstructuras$ = this.informeService
      .getAllEstructuras(this.informeId)
      .pipe(take(1))
      .subscribe((estArray) => {
        if (!this.allElementosPlanta) {
          this.allElementosPlanta = estArray;
        }
      });

    this.informeService.avisadorChangeElemento$.subscribe((elem) => {
      if (elem.constructor.name === Estructura.name) {
        const elemPos = this.allElementosPlanta.findIndex((est) => {
          return est.id === elem.id;
        });
        if (elemPos >= 0) {
          // Le borramos y le volvemos a añadir
          this.allElementosPlanta.splice(elemPos, 1);
          this.deleteEstructuraCircle(elem as Estructura);

          this.allElementosPlanta.push(elem);
          this.drawEstructuraCircle(elem as Estructura);
        }
      }
    });

    this.informeService.avisadorNuevoElemento$.subscribe((elem) => {
      if (elem.constructor.name === Estructura.name) {
        const elemPos = this.allElementosPlanta.findIndex((est) => {
          return est.id === elem.id;
        });

        if (elemPos >= 0) {
          // Si está, le borramos
          this.allElementosPlanta.splice(elemPos, 1);

          this.deleteEstructuraCircle(elem as Estructura);
        } else {
          // Si no está, le añadimos
          this.allElementosPlanta.push(elem);
          this.drawEstructuraCircle(elem as Estructura);
        }
      }
    });
    this.informeService
      .getInforme(this.informeId)
      .pipe(
        switchMap((informe) => {
          return this.plantaService.getPlanta(informe.plantaId);
        })
      )
      .subscribe((planta) => {
        this.planta = planta;
      });

    this.informeService.selectedElementoPlanta$.subscribe((elem) => {
      if (elem !== null && elem !== undefined && elem.constructor.name === Estructura.name) {
        this.selectElementoPlanta(elem);
      }
    });
  }

  selectElementoPlanta(elementoPlanta: ElementoPlantaInterface) {
    if (this.selectedEstructura !== undefined && this.selectedEstructura !== null) {
      this.updateCircleAppearance(this.selectedEstructura as Estructura);
    }

    this.updateCircleAppearance(elementoPlanta as Estructura);
    this.selectedEstructura = elementoPlanta;
  }

  deleteEstructuraCircle(est: Estructura) {
    const elemPos = this.estDrawedInMap.findIndex((elem) => {
      return est.id === elem.id;
    });
    this.estDrawedInMap[elemPos].setMap(null);
    this.estDrawedInMap.splice(elemPos, 1);
    if (this.selectedEstructura && this.selectedEstructura.id === est.id) {
      this.selectedEstructura = null;
    }
  }

  drawEstructuraCircle(est: Estructura) {
    if (this.map) {
      const estCircle = new google.maps.Circle({
        center: est.getLatLng(),
        radius: this.getCircleRadius(),
        fillColor: this.getFillColor(est),
        strokeColor: this.getStrokeColor(est),
        strokeWeight: this.getStrokeWeight(est),
        draggable: true,
        editable: false,
        id: est.id,
        map: this.map,
      });

      google.maps.event.addListener(estCircle, 'dragend', (coords: LatLng) => {
        this.onMapElementoPlantaDragEnd(est, coords);
      });
      google.maps.event.addListener(estCircle, 'click', (coords: LatLng) => {
        this.onMapElementoPlantaClick(est);
      });
      this.estDrawedInMap.push(estCircle);
    }
  }

  drawDroneLatLngCircle(latLng: LatLngLiteral) {
    if (this.map) {
      const droneCircle = new google.maps.Circle({
        radius: 5,
        fillColor: 'yellow',
        draggable: false,
        editable: false,
        clickable: false,
        stroColor: 'orange',
        strokeWeight: 2,
        map: this.map,
        center: latLng,
      });
      if (this.droneCircle) {
        this.droneCircle.setMap(null);
      }
      this.droneCircle = droneCircle;
      this.map.setCenter(latLng);
    }
  }

  getEstructurasMostrarEnMapa(): ElementoPlantaInterface[] {
    if (this.soloEstructurasVuelo) {
      return this.allElementosPlanta.filter((elemn) => {
        return elemn.vuelo === this.informeService.selectedArchivoVuelo.vuelo;
      });
    }
    return this.allElementosPlanta;
  }

  onMapElementoPlantaClick(elementoPlanta: ElementoPlantaInterface): void {
    // this.selectedElementoPlanta = elementoPlanta;
    this.informeService.selectElementoPlanta(elementoPlanta);
  }

  updateCircleAppearance(est: Estructura) {
    const elemPos = this.estDrawedInMap.findIndex((elem) => {
      return est.id === elem.id;
    });
    if (elemPos >= 0) {
      this.estDrawedInMap[elemPos].setOptions({
        radius: this.getCircleRadius(),
        fillColor: this.getFillColor(est),
        strokeColor: this.getStrokeColor(est),
        strokeWeight: this.getStrokeWeight(est),
      });
    }
  }

  getFillColor(elementoPlanta: PcInterface & Estructura): string {
    if (this.validateElem.transform(elementoPlanta, this.planta)) {
      return 'grey';
    }
    return 'red';
  }
  getCircleRadius() {
    // if (this.planta !== undefined) {
    //   return this.planta.tipo === 'seguidores' ? 4 : 2;
    // }
    return 2;
  }
  getStrokeColor(elementoPlanta: PcInterface & Estructura): string {
    if (this.informeService.selectedElementoPlanta) {
      if (this.informeService.selectedElementoPlanta.id === elementoPlanta.id) {
        return '#7CFC00';
      }
    }
    if (this.planta.tipo === 'fija' && elementoPlanta.columnaInicio === 1) {
      return 'orange';
    }

    if (!this.validateElem.transform(elementoPlanta, this.planta)) {
      return 'red';
    }

    if (elementoPlanta.vuelo === this.informeService.selectedArchivoVuelo.vuelo) {
      return this.colorSameFlight;
    }
    return this.colorOtherFlight;
  }
  getStrokeWeight(elementoPlanta: ElementoPlantaInterface): number {
    if (this.informeService.selectedElementoPlanta) {
      if (this.informeService.selectedElementoPlanta.archivo === elementoPlanta.archivo) {
        return 3;
      }
    }
    if (elementoPlanta.vuelo === this.informeService.selectedArchivoVuelo.vuelo) {
      return 2;
    }
    return 1;
  }
  getTrayectoryColor(vuelo: string) {
    if (this.informeService.selectedArchivoVuelo.vuelo === vuelo) {
      return this.colorSameFlight;
    }
    return this.colorOtherFlight;
  }
  getTrayectoryStrokeWeight(vuelo: string) {
    if (this.informeService.selectedArchivoVuelo.vuelo === vuelo) {
      return 2;
    }
    return 1;
  }
  onTrayectoryRightClick(event) {
    console.log('EditMapComponent -> onTrayectoryRightClick -> event', event);
  }

  private changeLocationElementoPlanta(elementoPlanta: ElementoPlantaInterface, coords: LatLngLiteral) {
    elementoPlanta.setLatLng({ lat: coords.lat, lng: coords.lng });

    let globalCoords;
    let modulo;
    [globalCoords, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(elementoPlanta.getLatLng());

    elementoPlanta.setGlobals(globalCoords);
    elementoPlanta.setModulo(modulo);

    this.informeService.updateElementoPlanta(this.informeId, elementoPlanta);
  }

  private getLatLng(event: any): LatLngLiteral {
    if (event.hasOwnProperty('coords')) {
      return event.coords;
    }
    return { lat: event.latLng.lat(), lng: event.latLng.lng() };
  }

  onMapElementoPlantaDragEnd(elementoPlanta: ElementoPlantaInterface, event) {
    const latLng = this.getLatLng(event);
    if (this.planta.tipo === 'seguidores') {
      this.allElementosPlanta
        .filter((elem) => {
          return elem.archivo === elementoPlanta.archivo;
        })
        .forEach((elem) => {
          this.changeLocationElementoPlanta(elem, latLng);
        });
    } else {
      this.changeLocationElementoPlanta(elementoPlanta, latLng);
    }
    this.onMapElementoPlantaClick(elementoPlanta);
  }

  private setLocAreaList(plantaId: string): LocationAreaInterface[] {
    const locAreaList = [];
    this.plantaService
      .getLocationsArea(plantaId)
      .pipe(take(1))
      .subscribe((locAreaArray) => {
        locAreaArray.forEach((locationArea) => {
          const polygon = new google.maps.Polygon({
            paths: locationArea.path,
            strokeColor: '#FF0000',
            visible: false,
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: 'grey',
            fillOpacity: 0,
            editable: false,
            draggable: false,
            id: locationArea.id,
            globalX: locationArea.globalX,
            globalY: locationArea.globalY,
            globalCoords: locationArea.globalCoords,
            modulo: locationArea.modulo,
          });
          polygon.setMap(this.map);
          locAreaList.push(polygon);
          if (locAreaList.length === locAreaArray.length) {
            this.plantaService.setLocAreaList(locAreaList);
          }
        });
      });

    return locAreaList;
  }

  private drawAllEstructurasInMap() {
    this.getEstructurasMostrarEnMapa().forEach((est) => {
      this.drawEstructuraCircle(est as Estructura);
    });
  }

  mapIsReady(map) {
    this.map = map;
    this.plantaService.initMap(this.planta, map);
    this.setLocAreaList(this.planta.id);

    this.drawAllEstructurasInMap();
  }
}
