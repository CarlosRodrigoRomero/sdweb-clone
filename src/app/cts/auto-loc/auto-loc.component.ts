import {
  Component,
  OnInit,
  ViewChild,
  ViewChildren,
  QueryList
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { PlantaService } from "src/app/services/planta.service";
import { PlantaInterface } from "../../models/planta";
import { LocationAreaInterface } from "src/app/models/location";
import { LatLngLiteral } from "@agm/core/map-types";
import { Observable } from "rxjs";
import { take } from "rxjs/operators";
import { AgmPolygon, AgmMap } from "@agm/core";
import { ModuloInterface } from '../../models/modulo';
declare const google: any;

@Component({
  selector: "app-auto-loc",
  templateUrl: "./auto-loc.component.html",
  styleUrls: ["./auto-loc.component.css"]
})
export class AutoLocComponent implements OnInit {
  @ViewChildren(AgmPolygon) polygonData: QueryList<AgmPolygon>;
  @ViewChild(AgmMap) map: any;

  public planta: PlantaInterface;
  public defaultZoom: number;
  public mapType: string;
  public plantaLocation: LatLngLiteral;
  public plantaId: string;
  public selectedLocationArea: LocationAreaInterface;
  public locationAreaList: LocationAreaInterface[];
  public locationAreaList$: Observable<LocationAreaInterface[]>;
  public polygonList: any[];
  public selectedPolygon: any;
  private _strokeOpacity: number;
  private _fillOpacity: number;
  public modulos: ModuloInterface[];
  public maxPolygonsVisibles: number;
  public minPolygonsVisibles: number;
  public polygonsAllHidden: boolean;
  public lastLocationArea: LocationAreaInterface;

  constructor(
    private route: ActivatedRoute,
    private plantaService: PlantaService
  ) {}

  ngOnInit() {
    this.mapType = "satellite";
    this.defaultZoom = 18;
    this.plantaLocation = { lng: -5.880743, lat: 39.453186 };

    this.plantaId = this.route.snapshot.paramMap.get("id");
    this.getPlanta(this.plantaId);
    this.locationAreaList = [];
    this.polygonList = [];
    this.minPolygonsVisibles = 25;
    this.maxPolygonsVisibles = 50;
    this.polygonsAllHidden = false;
    this.lastLocationArea = undefined;
  }

  getPlanta(plantaId: string) {
    this.plantaService.getPlanta(plantaId).subscribe(
      response => {
        this.planta = response;
        this.defaultZoom = this.planta.zoom;
        this.plantaLocation.lat = this.planta.latitud;
        this.plantaLocation.lng = this.planta.longitud;

        this.plantaService.getModulos(this.planta.id).subscribe(
          modulos => {
          this.modulos = modulos;
                });
      },
      error => {
        const errorMessage = error as any;
        if (errorMessage != null) {
          console.log(error);
        }
      }
    );
  }

  onMapReady(map) {
    this.initDrawingManager(map);

    this.locationAreaList$ = this.plantaService.getLocationsArea(this.plantaId);
    this.locationAreaList$.pipe(take(1)).subscribe(locationAreaList => {
      locationAreaList.sort(this.sortByGlobalX);
      this.locationAreaList = locationAreaList;

      this.locationAreaList.forEach( (locationArea, idx, arr) => {
          this.locationAreaList[idx].visible = true;
          this.addPolygonToMap(locationArea);
      });
    });
  }

  private addPolygonToMap(locationArea: LocationAreaInterface) {
    locationArea.visible = true;
    this.map._mapsWrapper
      .createPolygon({
        paths: locationArea.path,
        strokeColor: locationArea.globalX.length > 0 ? "green" : "red",
        strokeOpacity: this._strokeOpacity,
        strokeWeight: 2,
        fillColor: locationArea.globalX.length > 0 ? "green" : "grey",
        fillOpacity: this._fillOpacity,
        editable: true,
        draggable: true,
        id: locationArea.id
      })
      .then((polygon: any) => {
        this.polygonList.push(polygon);
        google.maps.event.addListener(polygon, "mouseup", event => {
          this.selectLocationArea(locationArea);
          this.modifyLocationArea(locationArea);
        });
      });
  }

  private modifyLocationArea(locationArea: LocationAreaInterface) {
    console.log("TCL: AutoLocComponent -> modifyLocationArea -> locationArea", locationArea)
    console.log("TCL: AutoLocComponent -> modifyLocationArea -> this.polygonList", this.polygonList)

    const polygon = this.polygonList.find(item => {
      return item.id === locationArea.id;
    });
    var vertices = polygon.getPath();
    // Iterate over the vertices.
    let newPath: LatLngLiteral[] = [];
    for (var i = 0; i < vertices.getLength(); i++) {
      var xy = vertices.getAt(i);
      newPath.push({ lat: xy.lat(), lng: xy.lng() });
    }
    locationArea.path = newPath;
    this.updateLocationArea(locationArea);
  }

  public selectLocationArea(locationArea: LocationAreaInterface) {
    console.log("TCL: AutoLocComponent -> selectLocationArea -> locationArea", locationArea)
    console.log("TCL: AutoLocComponent -> selectLocationArea -> this.selectedPolygon", this.selectedPolygon)

    if (this.selectedPolygon !== undefined) {
      this.selectedPolygon.setOptions({ fillColor: "grey" });
    }

    const polygon = this.polygonList.find(item => {
      return item.id === locationArea.id;
    });
    console.log("TCL: AutoLocComponent -> selectLocationArea -> this.polygonList", this.polygonList)
    console.log("TCL: AutoLocComponent -> selectLocationArea -> polygon", polygon)

    polygon.setOptions({ fillColor: "#FF0000" });

    this.selectedLocationArea = locationArea;
    this.selectedPolygon = polygon;
  }

  initDrawingManager(map: any) {
    const options = {
      drawingControl: true,
      drawingControlOptions: {
        drawingModes: ["polygon", "rectangle"]
      },
      polygonOptions: {
        draggable: true,
        editable: true
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON
    };

    const drawingManager = new google.maps.drawing.DrawingManager(options);
    drawingManager.setMap(map);

    this.addEventListeners(drawingManager);
  }
  deleteLocationArea(selectedLocationArea: LocationAreaInterface) {
    // Eliminar del mapa
    const polygon = this.polygonList.find(item => {
      return item.id === selectedLocationArea.id;
    });
    polygon.setMap(null);
    this.polygonList = this.polygonList.filter(item => item.id !== polygon.id );


    // Eliminar de la lista
    this.locationAreaList = this.locationAreaList.filter(item => item.id !== selectedLocationArea.id );
    
    // Eliminar de la BD
    this.plantaService.delLocationArea(selectedLocationArea);
  }

  updateLocationArea(selectedLocationArea: LocationAreaInterface) {
    this.plantaService.updateLocationArea(selectedLocationArea);
  }
  
  sortByDistancia(a, b) {
    if (a.distancia < b.distancia) {
      return -1;
    }
    if (a.distancia > b.distancia) {
      return 1;
    }
    return 0;
  }

  showCloserPolygons() {
    let locAreasYDistancias = [];
    if ( this.lastLocationArea ) {
      console.log('this.lastLocationArea', this.lastLocationArea);
      this.locationAreaList.forEach( locArea => {
        locAreasYDistancias.push({locArea: locArea, distancia: this.calculateDistance(this.lastLocationArea, locArea)}) 
        locArea.path[0].lat
      });
      locAreasYDistancias.sort(this.sortByDistancia);


      // Ocultar todos
      this.showOrHideAllPolygons(true);
      // 1 - ordenamos por distacia

      let contarMaxPoylgonsVisibles = 0;
      locAreasYDistancias.forEach( locAreaYDist => {
        const locArea = locAreaYDist.locArea;
        contarMaxPoylgonsVisibles += 1;
        if ( contarMaxPoylgonsVisibles <= this.minPolygonsVisibles) {
          this.addPolygonToMap(locArea);
        }
    });    
  }
}

  calculateDistance(locArea1: LocationAreaInterface, locArea2: LocationAreaInterface) {

    const p1 = new google.maps.LatLng(locArea1.path[0].lat, locArea1.path[0].lng);
    const p2 = new google.maps.LatLng(locArea2.path[0].lat, locArea2.path[0].lng);
    return Math.round(google.maps.geometry.spherical.computeDistanceBetween(p1, p2));
  }

  showOrHideAllPolygons(hideAll = false) {    
    if (this.polygonsAllHidden || !hideAll) {
      console.log("TCL: AutoLocComponent -> showOrHideAllPolygons -> this.polygonsAllHidden", this.polygonsAllHidden)
      this.polygonsAllHidden = false;
      this.locationAreaList.forEach(locArea => {
        this.changeVisibilityPolygon(locArea);
      })

    } else {
    this.polygonsAllHidden = true;
    this.polygonList.forEach(polygon => {
      polygon.setMap(null);
    });
    this.polygonList = [];
    this.locationAreaList.map(locArea => {
      locArea.visible = false;
      return locArea;
      });
    }
  }

  changeVisibilityPolygon(locArea: LocationAreaInterface) {
    const polygon = this.polygonList.find(item => {
      return item.id === locArea.id;
    });
    if ( polygon == undefined ) {
      this.addPolygonToMap(locArea);
    } else {
    // this will save opacity values and set them to 0, and rebound the polygon to the map
    if (locArea.visible) {
      polygon.visible = false;
      polygon.clickable = false;
      polygon.setEditable(false);
      polygon.strokeOpacity = 0;
      polygon.fillOpacity = 0;
    } else {
      polygon.visible = true;
      polygon.clickable = true;
      polygon.setEditable(true);
      polygon.strokeOpacity = this._strokeOpacity;
      polygon.fillOpacity = this._fillOpacity;
    }
  }
    locArea.visible = !locArea.visible;
  }

  sortByGlobalX(a: LocationAreaInterface, b: LocationAreaInterface) {
    if (a.globalX < b.globalX) {
      return -1;
    }
    if (a.globalX > b.globalX) {
      return 1;
    }
    return 0;
  }

  addEventListeners(drawingManager: any) {
    google.maps.event.addListener(
      drawingManager,
      "polygoncomplete",
      polygon => {
        polygon.setMap(null);
        let path: LatLngLiteral[] = [];
        let locationArea = {} as LocationAreaInterface;
        for (var i = 0; i < polygon.getPath().getLength(); i++) {
          path.push({
            lat: polygon
              .getPath()
              .getAt(i)
              .lat() as number,
            lng: polygon
              .getPath()
              .getAt(i)
              .lng() as number
          });
        }
        locationArea.path = path;
        locationArea.visible = true;
        locationArea.globalX = "";
        locationArea.globalY = "";
        locationArea.plantaId = this.plantaId;
        this.locationAreaList.push(locationArea);
        this.selectedLocationArea = locationArea;
        // DB: Añadir a coleccion 'locations' dentro de 'planta'
        // google.maps.event.addListener(polygon, "mouseup", event => {
        //   this.selectLocationArea(locationArea);
        //   this.modifyLocationArea(locationArea);
        // });
        this.polygonList.push(polygon);
        this.plantaService.addLocationArea(this.plantaId, locationArea);
      }
    );
    google.maps.event.addListener(
      drawingManager,
      "rectanglecomplete",
      rectangle => {
        rectangle.setMap(null);
        let path: LatLngLiteral[] = [];
        let locationArea = {} as LocationAreaInterface;
        const bounds = rectangle.getBounds();

        const getNorthEast = bounds.getNorthEast();

        const getSouthWest = bounds.getSouthWest();

        path.push({ lat: getNorthEast.lat(), lng: getNorthEast.lng() });
        path.push({ lat: getNorthEast.lat(), lng: getSouthWest.lng() });
        path.push({ lat: getSouthWest.lat(), lng: getSouthWest.lng() });
        path.push({ lat: getSouthWest.lat(), lng: getNorthEast.lng() });

        locationArea.path = path;
        locationArea.visible = true;
        locationArea.globalX = "";
        locationArea.globalY = "";
        locationArea.plantaId = this.plantaId;
                
        
        // google.maps.event.addListener(rectangle, "mouseup", event => {
        //   this.selectLocationArea(locationArea);
        //   this.modifyLocationArea(locationArea);
        // });
        // this.polygonList.push(rectangle);

        // DB: Añadir a coleccion 'locations' dentro de 'planta'
        locationArea = this.plantaService.addLocationArea(this.plantaId, locationArea);
        this.locationAreaList.push(locationArea);
        this.selectedLocationArea = locationArea;
        rectangle.id = locationArea.id
        // this.polygonList.push(rectangle);

        if (this.polygonList.filter(item => item.visible === true).length > this.maxPolygonsVisibles || this.lastLocationArea === undefined) {
          console.log('yes');
          this.lastLocationArea = locationArea;
          this.showCloserPolygons();
        } else {
          this.lastLocationArea = locationArea;
          this.addPolygonToMap(locationArea);
        }
      }
    );
  }
}
