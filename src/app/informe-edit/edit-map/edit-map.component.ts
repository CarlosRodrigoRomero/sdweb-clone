import { Component, OnInit, ViewChild, Input, AfterViewInit } from '@angular/core';
import { AgmMap, LatLngLiteral } from '@agm/core';
import { PcInterface } from 'src/app/models/pc';
import { Estructura } from '../../models/estructura';
import { InformeService } from '../../services/informe.service';
import { PlantaService } from '../../services/planta.service';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';
import { ValidateElementoPlantaPipe } from '../../pipes/validate-elemento-planta.pipe';
import { take } from 'rxjs/operators';
import { InformeInterface } from '../../models/informe';
import { LocationAreaInterface } from 'src/app/models/location';

@Component({
  selector: 'app-edit-map',
  templateUrl: './edit-map.component.html',
  styleUrls: ['./edit-map.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditMapComponent implements OnInit {
  @ViewChild(AgmMap) map: any;
  @Input() pcsOrEstructuras: boolean;
  @Input() currentLatLng: LatLngLiteral;

  mapType: string;
  defaultZoom: number;
  allElementosPlanta: ElementoPlantaInterface[];
  polygonList: any[];
  informeId: string;
  informe: InformeInterface;

  constructor(
    private route: ActivatedRoute,
    public informeService: InformeService,
    private plantaService: PlantaService,
    private validateElem: ValidateElementoPlantaPipe
  ) {}

  ngOnInit() {
    this.mapType = 'satellite';
    this.defaultZoom = 18;
    this.currentLatLng = { lat: 39.453186, lng: -5.880743 };
    this.polygonList = [];
    this.informeId = this.route.snapshot.paramMap.get('id');

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
          this.allElementosPlanta.splice(elemPos, 1);
          // Si no está, le añadimos
          this.allElementosPlanta.push(elem);
        }
      }
    });

    this.informeService.avisadorNuevoElemento$.subscribe((elem) => {
      if (elem.constructor.name === Estructura.name) {
        const elemPos = this.allElementosPlanta.findIndex((est) => {
          return est.id === elem.id;
        });

        if (elemPos >= 0) {
          this.allElementosPlanta.splice(elemPos, 1);
        } else {
          // Si no está, le añadimos
          this.allElementosPlanta.push(elem);
        }
      }
    });
    this.informeService
      .getInforme(this.informeId)
      .pipe(take(1))
      .subscribe((informe) => {
        this.setLocAreaList(informe.plantaId);
        this.informe = informe;
      });
  }

  onMapElementoPlantaClick(elementoPlanta: ElementoPlantaInterface): void {
    // this.selectedElementoPlanta = elementoPlanta;
    this.informeService.selectElementoPlanta(elementoPlanta);

    // if (elementoPlanta.vuelo !== this.currentFlight) {
    //   this.changeFlight(elementoPlanta.vuelo);
    // }
    // const sliderValue = this.fileList.indexOf(elementoPlanta.archivo);
    // this.rangeValue = sliderValue + 1;
    // this.setImageFromRangeValue(this.rangeValue);
  }
  getFillColor(elementoPlanta: PcInterface & Estructura): string {
    if (this.validateElem.transform(elementoPlanta)) {
      return 'red';
    }
    return 'grey';
  }
  getStrokeColor(elementoPlanta: ElementoPlantaInterface): string {
    if (this.informeService.selectedElementoPlanta) {
      if (this.informeService.selectedElementoPlanta.archivo === elementoPlanta.archivo) {
        return '#7CFC00';
      }
    }

    if (elementoPlanta.vuelo === this.informeService.selectedArchivoVuelo.vuelo) {
      return 'white';
    }
    return 'aqua';
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

  onMapMarkerClick(pc: PcInterface): void {
    // if (this.selected_pc !== pc && this.selected_pc) {
    //   this.selected_pc.color = 'black';
    // }
    // // Cambiar el color del marker
    // this.selected_pc = pc;
    // this.selected_pc.color = 'white';
    // if (pc.vuelo !== this.currentFlight) {
    //   this.changeFlight(pc.vuelo);
    // }
    // // Poner imagen del pc
    // const sliderValue = this.fileList.indexOf(pc.archivo);
    // if (sliderValue === this.rangeValue - 1) {
    //   this.canvas.getObjects().forEach((object) => {
    //     if (object.isType('rect')) {
    //       object.set('strokeWidth', object.local_id === this.selected_pc.local_id ? this._selectedStrokeWidth : 1);
    //       object.set('selectable', object.local_id === this.selected_pc.local_id);
    //       if (!object.ref) {
    //         // Si no es referencia
    //         if (object.local_id === this.selected_pc.local_id) {
    //           // this.canvas.setActiveObject(object);
    //         }
    //         object.set('stroke', object.local_id === this.selected_pc.local_id ? 'white' : 'red');
    //       }
    //     }
    //   });
    //   this.canvas.renderAll();
    // } else {
    //   this.rangeValue = sliderValue + 1;
    //   this.setImageFromRangeValue(this.rangeValue);
    // }
  }

  onMapElementoPlantaDragEnd(elementoPlanta: ElementoPlantaInterface, event) {
    elementoPlanta.setLatLng({ lat: event.coords.lat, lng: event.coords.lng });
    this.onMapElementoPlantaClick(elementoPlanta);

    // TODO: implementar globalCoordsFromLocation
    let globalX;
    let globalY;
    let modulo;
    [globalX, globalY, modulo] = this.plantaService.getGlobalCoordsFromLocationArea(event.coords);

    elementoPlanta.setGlobals([globalX, globalY]);
    elementoPlanta.setModulo(modulo);

    this.informeService.updateElementoPlanta(this.informeId, elementoPlanta);
  }

  private setLocAreaList(plantaId: string): LocationAreaInterface[] {
    const locAreaList = [];
    this.plantaService
      .getLocationsArea(plantaId)
      .pipe(take(1))
      .subscribe((locAreaArray) => {
        locAreaArray.forEach((locationArea) => {
          this.map._mapsWrapper
            .createPolygon({
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
              modulo: locationArea.modulo,
            })
            .then((polygon: any) => {
              locAreaList.push(polygon);
              if (locAreaList.length === locAreaArray.length) {
                this.plantaService.setLocAreaList(locAreaList);
              }
            });
        });
      });

    return locAreaList;
  }
}
