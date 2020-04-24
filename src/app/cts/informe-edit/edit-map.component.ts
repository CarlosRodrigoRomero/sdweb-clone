import { Component, OnInit, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { AgmMap, LatLngLiteral } from '@agm/core';
import { PcInterface } from 'src/app/models/pc';
import { EstructuraInterface } from '../../models/estructura';
import { InformeService } from '../../services/informe.service';
import { ModuloInterface } from 'src/app/models/modulo';
import { PlantaService } from '../../services/planta.service';
import { take } from 'rxjs/operators';
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
  @Input() informeId: string;
  @Input() currentLatLng: LatLngLiteral;

  mapType: string;
  defaultZoom: number;
  allEstructuras: EstructuraInterface[];
  selectedElementoPlanta: PcInterface | EstructuraInterface;
  polygonList: any[];

  constructor(private informeService: InformeService, private plantaService: PlantaService) {
    this.mapType = 'satellite';
    this.defaultZoom = 18;
    this.currentLatLng = { lat: 39.453186, lng: -5.880743 };
    this.polygonList = [];
  }

  ngOnInit() {
    // this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
    //   if (elementoPlanta !== this.elementoPlanta) {
    //     this.selectElementoPlanta(elementoPlanta);
    //   }
    // });

    this.informeService
      .getAllEstructuras(this.informeId)
      .pipe(take(1))
      .subscribe((estArray) => {
        this.allEstructuras = estArray;
      });

    this.informeService.avisadorNuevoElemento$.subscribe((elem) => {
      console.log('EditMapComponent -> ngOnInit -> elem', elem);
      if (elem.hasOwnProperty('filaInicio')) {
        const elemPos = this.allEstructuras.findIndex((est) => {
          return est.id === elem.id;
        });
        console.log('EditMapComponent -> ngOnInit -> elemPos', elemPos);
        if (elemPos > 0) {
          this.allEstructuras.splice(elemPos, 1);
        } else {
          this.allEstructuras.push(elem);
        }
      }
    });

    // this.getPolygonList(this.informe.plantaId);
  }

  // selectElementoPlanta(elementoPlanta: PcInterface | EstructuraInterface): void {
  //   console.log('EditMapComponent -> selectElementoPlanta -> elementoPlanta', elementoPlanta);
  // }

  onMapEstClick(elementoPlanta: PcInterface | EstructuraInterface): void {
    this.selectedElementoPlanta = elementoPlanta;
    console.log('EditMapComponent -> onMapEstClick -> elementoPlanta', elementoPlanta);
    this.informeService.selectElementoPlanta(elementoPlanta);

    // if (elementoPlanta.vuelo !== this.currentFlight) {
    //   this.changeFlight(elementoPlanta.vuelo);
    // }
    // const sliderValue = this.fileList.indexOf(elementoPlanta.archivo);
    // this.rangeValue = sliderValue + 1;
    // this.setImageFromRangeValue(this.rangeValue);
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

  onMapEstDragEnd(est: EstructuraInterface, event) {
    this.onMapEstClick(est);
    est.latitud = event.coords.lat;
    est.longitud = event.coords.lng;

    // TODO: implementar globalCoordsFromLocation
    // let globalX;
    // let globalY;
    // let modulo;
    // [globalX, globalY, modulo] = this.getGlobalCoordsFromLocationArea(event.coords);
    this.informeService.updateEstructura(this.informeId, est);
  }

  // onMarkerDragEnd(pc: PcInterface, event) {
  //   this.onMapMarkerClick(pc);
  //   pc.gps_lat = event.coords.lat;
  //   pc.gps_lng = event.coords.lng;
  //   let globalX;
  //   let globalY;
  //   let modulo;

  //   pc.image_rotation = this.current_image_rotation;

  //   [globalX, globalY, modulo] = this.getGlobalCoordsFromLocationArea(event.coords);

  //   this.updateLocalAreaInPc(pc, globalX, globalY, modulo);
  // }

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
