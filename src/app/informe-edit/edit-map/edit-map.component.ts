import { Component, OnInit, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { AgmMap, LatLngLiteral } from '@agm/core';
import { PcInterface } from 'src/app/models/pc';
import { Estructura } from '../../models/estructura';
import { InformeService } from '../../services/informe.service';
import { ModuloInterface } from 'src/app/models/modulo';
import { PlantaService } from '../../services/planta.service';
import { take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';
import { ArchivoVueloInterface } from 'src/app/models/archivoVuelo';
import { ValidateEstructuraPipe } from '../../pipes/validate-estructura.pipe';
declare const google: any;

@Component({
  selector: 'app-edit-map',
  templateUrl: './edit-map.component.html',
  styleUrls: ['./edit-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditMapComponent implements OnInit {
  @ViewChild(AgmMap) map: any;
  @Input() pcsOrEstructuras: boolean;
  @Input() currentLatLng: LatLngLiteral;

  mapType: string;
  defaultZoom: number;
  allElementosPlanta: ElementoPlantaInterface[];
  selectedElementoPlanta: ElementoPlantaInterface;
  polygonList: any[];
  informeId: string;
  currentArchivoVuelo: ArchivoVueloInterface;

  constructor(
    private route: ActivatedRoute,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private validateEst: ValidateEstructuraPipe
  ) {}

  ngOnInit() {
    this.mapType = 'satellite';
    this.defaultZoom = 18;
    this.currentLatLng = { lat: 39.453186, lng: -5.880743 };
    this.polygonList = [];
    this.informeId = this.route.snapshot.paramMap.get('id');
    // this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
    //   if (elementoPlanta !== this.elementoPlanta) {
    //     this.selectElementoPlanta(elementoPlanta);
    //   }
    // });

    this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
      this.currentArchivoVuelo = archivoVuelo;
    });
    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      this.selectedElementoPlanta = elementoPlanta;
    });

    this.informeService
      .getAllEstructuras(this.informeId)
      .pipe(take(1))
      .subscribe((estArray) => {
        this.allElementosPlanta = estArray;
      });

    this.informeService.avisadorNuevoElemento$.subscribe((elem) => {
      if (elem.hasOwnProperty('filaInicio')) {
        const elemPos = this.allElementosPlanta.findIndex((est) => {
          return est.id === elem.id;
        });
        if (elemPos > 0) {
          this.allElementosPlanta.splice(elemPos, 1);
        } else {
          this.allElementosPlanta.push(elem);
        }
      }
    });

    // this.getPolygonList(this.informe.plantaId);
  }

  // selectElementoPlanta(elementoPlanta: PcInterface | EstructuraInterface): void {
  //   console.log('EditMapComponent -> selectElementoPlanta -> elementoPlanta', elementoPlanta);
  // }

  onMapElementoPlantaClick(elementoPlanta: ElementoPlantaInterface): void {
    this.selectedElementoPlanta = elementoPlanta;
    this.informeService.selectElementoPlanta(elementoPlanta);

    // if (elementoPlanta.vuelo !== this.currentFlight) {
    //   this.changeFlight(elementoPlanta.vuelo);
    // }
    // const sliderValue = this.fileList.indexOf(elementoPlanta.archivo);
    // this.rangeValue = sliderValue + 1;
    // this.setImageFromRangeValue(this.rangeValue);
  }
  getFillColor(elementoPlanta: PcInterface & Estructura): string {
    if (this.validateEst.transform(elementoPlanta)) {
      return 'red';
    }
    return 'grey';
  }
  getStrokeColor(elementoPlanta: ElementoPlantaInterface): string {
    if (this.selectedElementoPlanta) {
      if (this.selectedElementoPlanta.archivo === elementoPlanta.archivo) {
        return 'white';
      }
    }

    if (elementoPlanta.vuelo === this.currentArchivoVuelo.vuelo) {
      return '#7CFC00';
    }
    return 'grey';
  }
  getStrokeWeight(elementoPlanta: ElementoPlantaInterface): number {
    if (this.selectedElementoPlanta) {
      if (this.selectedElementoPlanta.archivo === elementoPlanta.archivo) {
        return 3;
      }
    }
    if (elementoPlanta.vuelo === this.currentArchivoVuelo.vuelo) {
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
    // let globalX;
    // let globalY;
    // let modulo;
    // [globalX, globalY, modulo] = this.getGlobalCoordsFromLocationArea(event.coords);
    this.informeService.updateElementoPlanta(this.informeId, elementoPlanta);
  }

  recalcularLocs() {
    console.log('TODO: implementar...');
    // this.allPcs.forEach((pc) => {
    //   let globalX;
    //   let globalY;
    //   let modulo;

    //   [globalX, globalY, modulo] = this.getGlobalCoordsFromLocationArea({
    //     lat: pc.gps_lat,
    //     lng: pc.gps_lng,
    //   });

    //   this.updateLocalAreaInPc(pc, globalX, globalY, modulo);
    // });
  }

  getPolygonList(plantaId: string) {
    this.plantaService.getLocationsArea(plantaId).subscribe((items) => {
      this.polygonList = [];
      items.forEach((locationArea) => {
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
            this.polygonList.push(polygon);
          });
      });
    });
  }

  getGlobalCoordsFromLocationArea(coords: any) {
    const latLng = new google.maps.LatLng(coords.lat, coords.lng);
    let globalX = '';
    let globalY = '';
    let modulo: ModuloInterface = {};

    for (let i = 0; i < this.polygonList.length; i++) {
      if (google.maps.geometry.poly.containsLocation(latLng, this.polygonList[i])) {
        if (this.polygonList[i].globalX.length > 0) {
          globalX = this.polygonList[i].globalX;
        }
        if (this.polygonList[i].globalY.length > 0) {
          globalY = this.polygonList[i].globalY;
        }

        if (this.polygonList[i].hasOwnProperty('modulo')) {
          if (this.polygonList[i].modulo !== undefined) {
            modulo = this.polygonList[i].modulo;
          }
        }
      }
    }

    return [globalX, globalY, modulo];
  }
}
