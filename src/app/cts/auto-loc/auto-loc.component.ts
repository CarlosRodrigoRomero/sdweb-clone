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
  }

  getPlanta(plantaId: string) {
    this.plantaService.getPlanta(plantaId).subscribe(
      response => {
        this.planta = response;
        this.defaultZoom = this.planta.zoom;
        this.plantaLocation.lat = this.planta.latitud;
        this.plantaLocation.lng = this.planta.longitud;
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
      this.locationAreaList = locationAreaList;

      locationAreaList.forEach(locationArea => {
        this.map._mapsWrapper
          .createPolygon({
            paths: locationArea.path,
            strokeColor: "#FF0000",
            strokeOpacity: this._strokeOpacity,
            strokeWeight: 2,
            fillColor: "grey",
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
      });
    });
  }

  private modifyLocationArea(locationArea: LocationAreaInterface) {
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
    if (this.selectedPolygon !== undefined) {
      this.selectedPolygon.setOptions({ fillColor: "grey" });
    }

    const polygon = this.polygonList.find(item => {
      return item.id === locationArea.id;
    });
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

    google.maps.event.addListener(
      drawingManager,
      "polygoncomplete",
      polygon => {
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

        this.plantaService.addLocationArea(this.plantaId, locationArea);
      }
    );
  }
  deleteLocationArea(selectedLocationArea: LocationAreaInterface) {
    this.plantaService.delLocationArea(selectedLocationArea);
  }

  updateLocationArea(selectedLocationArea: LocationAreaInterface) {
    this.plantaService.updateLocationArea(selectedLocationArea);
  }

  changeVisibilityPolygon(locArea: LocationAreaInterface) {
    const polygon = this.polygonList.find(item => {
      return item.id === locArea.id;
    });
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
}
