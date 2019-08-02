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
import { AgmPolygon, AgmMap } from "@agm/core";
import { ModuloInterface } from "../../models/modulo";
import {
  MatSort,
  MatTableDataSource,
  MatPaginator,
  getMatIconFailedToSanitizeUrlError
} from "@angular/material";
import { SelectionModel } from "@angular/cdk/collections";
declare const google: any;

@Component({
  selector: "app-auto-loc",
  templateUrl: "./auto-loc.component.html",
  styleUrls: ["./auto-loc.component.css"]
})
export class AutoLocComponent implements OnInit {
  @ViewChildren(AgmPolygon) polygonData: QueryList<AgmPolygon>;
  @ViewChild(AgmMap) map: any;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

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
  public displayedColumns: string[];
  public selection: SelectionModel<LocationAreaInterface>;
  public locAreaDataSource: MatTableDataSource<LocationAreaInterface>;
  public moduloSelecLista: ModuloInterface;

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
    this.polygonList = [];
    this.minPolygonsVisibles = 30;
    this.maxPolygonsVisibles = 1000;
    this.polygonsAllHidden = false;
    this.lastLocationArea = undefined;
    this.displayedColumns = ["select", "globalX", "globalY", "modulo"];

    this.locAreaDataSource = new MatTableDataSource([]);
    this.locAreaDataSource.sortData = (data, sort: MatSort) => {
      if (sort.active === "globalX") {
        data.sort(this.sortByGlobalX);
      }
      return data;
    };
    this.locAreaDataSource.filterPredicate = (locArea, filter) =>
      locArea.globalX === parseInt(filter, 10) ||
      locArea.globalY === filter ||
      locArea.globalX.toLowerCase().startsWith(filter) ||
      locArea.globalY.toLowerCase().startsWith(filter) ||
      parseInt(locArea.globalY, 10) === parseInt(filter, 10) ||
      locArea.globalX.toString().toLowerCase() === filter;

    this.locAreaDataSource.sort = this.sort;
    this.locAreaDataSource.paginator = this.paginator;
    this.locationAreaList$ = this.plantaService.getLocationsArea(this.plantaId);
    this.locationAreaList$.subscribe(list => {
      list.forEach(item => {
        delete item.visible;
      });
      this.locationAreaList = list;
      this.locAreaDataSource.data = list;
    });

    const initialSelection = [];
    const allowMultiSelect = true;
    this.selection = new SelectionModel<LocationAreaInterface>(
      allowMultiSelect,
      initialSelection
    );
  }

  getPlanta(plantaId: string) {
    this.plantaService.getPlanta(plantaId).subscribe(
      response => {
        this.planta = response;
        this.defaultZoom = this.planta.zoom;
        this.plantaLocation.lat = this.planta.latitud;
        this.plantaLocation.lng = this.planta.longitud;
        this.modulos = this.plantaService.getModulosPlanta(response);
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
  }

  private addPolygonToMap(locArea: LocationAreaInterface, isNew = false) {
    // locArea.visible = true;
    this.map._mapsWrapper
      .createPolygon({
        paths: locArea.path,
        strokeColor: locArea.hasOwnProperty("modulo") ? "yellow" : "grey",
        strokeOpacity: this._strokeOpacity,
        strokeWeight: 2,
        fillColor: this.getFillColor(locArea),
        fillOpacity: this._fillOpacity,
        editable: isNew,
        draggable: isNew,
        id: locArea.id
      })
      .then((polygon: any) => {
        this.polygonList.push(polygon);
        google.maps.event.addListener(polygon, "mouseup", event => {
          this.selectLocationArea(locArea);
          this.modifyLocationArea(locArea);
        });
      });
  }

  private modifyLocationArea(locationArea: LocationAreaInterface) {
    const polygon = this.polygonList.find(item => {
      return item.id === locationArea.id;
    });
    const vertices = polygon.getPath();
    // Iterate over the vertices.
    let newPath: LatLngLiteral[] = [];
    for (var i = 0; i < vertices.getLength(); i++) {
      let xy = vertices.getAt(i);
      newPath.push({ lat: xy.lat(), lng: xy.lng() });
    }
    locationArea.path = newPath;
    this.updateLocationArea(locationArea);
  }

  public selectLocationArea(locArea: LocationAreaInterface) {
    if (this.selectedPolygon !== undefined) {
      this.selectedPolygon.setOptions({
        fillColor: this.getFillColor(locArea),
        editable: false,
        draggable: false
      });
    }

    const polygon = this.polygonList.find(item => {
      return item.id === locArea.id;
    });

    if (polygon === undefined) {
      this.addPolygonToMap(locArea);
    } else {
      polygon.setOptions({
        fillColor: "white",
        editable: true,
        draggable: true
      });
    }

    this.selectedLocationArea = locArea;
    this.selectedPolygon = polygon;
    this.selection.select(locArea);
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
    this.polygonList = this.polygonList.filter(item => item.id !== polygon.id);

    // Eliminar de la BD
    this.plantaService.delLocationArea(selectedLocationArea);
  }

  updateLocationArea(locArea: LocationAreaInterface, moduleChange = false) {
    this.plantaService.updateLocationArea(locArea);

    if (moduleChange) {
      this.changeVisibilityPolygon(locArea);
      this.changeVisibilityPolygon(locArea);
    }
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
    if (this.lastLocationArea) {
      this.locationAreaList.forEach(locArea => {
        locAreasYDistancias.push({
          locArea: locArea,
          distancia: this.calculateDistance(this.lastLocationArea, locArea)
        });
        locArea.path[0].lat;
      });
      locAreasYDistancias.sort(this.sortByDistancia);

      // Ocultar todos
      this.showOrHideAllPolygons(true);
      // 1 - ordenamos por distacia

      let contarMaxPoylgonsVisibles = 0;
      locAreasYDistancias.forEach(locAreaYDist => {
        const locArea = locAreaYDist.locArea;
        contarMaxPoylgonsVisibles += 1;
        if (contarMaxPoylgonsVisibles <= this.minPolygonsVisibles) {
          this.addPolygonToMap(locArea);
        }
      });
    }
  }

  calculateDistance(
    locArea1: LocationAreaInterface,
    locArea2: LocationAreaInterface
  ) {
    const p1 = new google.maps.LatLng(
      locArea1.path[0].lat,
      locArea1.path[0].lng
    );
    const p2 = new google.maps.LatLng(
      locArea2.path[0].lat,
      locArea2.path[0].lng
    );
    return Math.round(
      google.maps.geometry.spherical.computeDistanceBetween(p1, p2)
    );
  }

  showOrHideAllPolygons(hideAll = false) {
    if (this.polygonsAllHidden || !hideAll) {
      this.polygonsAllHidden = false;
      this.locationAreaList.forEach(locArea => {
        this.changeVisibilityPolygon(locArea);
      });
    } else {
      this.polygonsAllHidden = true;
      this.polygonList.forEach(polygon => {
        polygon.setMap(null);
      });
      this.polygonList = [];
    }
  }

  changeVisibilityPolygon(
    locArea: LocationAreaInterface,
    fromCheckbox = false
  ) {
    const polygon = this.polygonList.find((item, idx) => {
      return item.id === locArea.id;
    });

    if (polygon === undefined) {
      this.addPolygonToMap(locArea);
    } else {
      const idx = this.polygonList.indexOf(polygon);
      this.polygonList.splice(idx, 1);
      polygon.setMap(null);
    }

    if (!fromCheckbox) {
      // locArea.visible = !locArea.visible;
    }
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
        // locationArea.visible = true;
        locationArea.globalX = "";
        locationArea.globalY = "";
        locationArea.plantaId = this.plantaId;

        // DB: Añadir a coleccion 'locations' dentro de 'planta'
        locationArea = this.plantaService.addLocationArea(
          this.plantaId,
          locationArea
        );
        this.locationAreaList.push(locationArea);
        this.selectedLocationArea = locationArea;
        polygon.id = locationArea.id;
        // this.polygonList.push(rectangle);

        this.lastLocationArea = locationArea;
        this.addPolygonToMap(locationArea, true);

        document.getElementById("globalX").focus();
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
        // locationArea.visible = true;
        locationArea.globalX = "";
        locationArea.globalY = "";
        locationArea.plantaId = this.plantaId;

        // DB: Añadir a coleccion 'locations' dentro de 'planta'
        locationArea = this.plantaService.addLocationArea(
          this.plantaId,
          locationArea
        );
        this.locationAreaList.push(locationArea);
        this.selectedLocationArea = locationArea;
        rectangle.id = locationArea.id;
        // this.polygonList.push(rectangle);

        this.lastLocationArea = locationArea;
        this.addPolygonToMap(locationArea, true);

        document.getElementById("globalX").focus();
      }
    );
  }
  getRowColor(locArea: LocationAreaInterface) {
    return locArea.hasOwnProperty("modulo") ? "yellow" : "black";
  }
  getFillColor(locArea: LocationAreaInterface) {
    if (locArea.globalX.length > 0) {
      return "green";
    } else if (locArea.globalY.length > 0) {
      return "blue";
    }
    return "grey";
  }

  applyFilter(filterValue: string) {
    this.locAreaDataSource.filter = filterValue.trim().toLowerCase();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.locAreaDataSource.data.length;
    return numSelected === numRows;
  }
  getLocAreaListConModulos() {
    return this.locationAreaList.filter(locArea => {
      if (locArea.hasOwnProperty("modulo")) {
        if (locArea.modulo !== undefined) {
          return true;
        }
      }
      return false;
    });
  }

  isAllModulesSelected() {
    const locAreaConModulos = this.getLocAreaListConModulos();

    const numSelected = this.selection.selected.length;
    const numRows = locAreaConModulos.length;

    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.clearSelection()
      : this.locAreaDataSource.filteredData.forEach(locArea => {
          if (!this.isSelected(locArea)) {
            this.addPolygonToMap(locArea);
            this.selection.select(locArea);
          }
        });
  }

  clearSelection() {
    this.selection.clear();
    this.showOrHideAllPolygons(true);
  }

  aplicarModulosSeleccion() {
    if (this.selection.selected.length > 0) {
      this.selection.selected.forEach(locArea => {
        if (this.moduloSelecLista) {
          locArea.modulo = this.moduloSelecLista;
          this.updateLocationArea(locArea, true);
        }
      });
    }
  }

  onSelectCheckboxChange(event, locArea: LocationAreaInterface) {
    event.stopPropagation();
    this.changeVisibilityPolygon(locArea, true);
  }

  isSelected(locArea: LocationAreaInterface) {
    const exists = this.selection.selected.find(item => {
      return item.id === locArea.id;
    });

    return exists !== undefined;
  }
  clearModulo(locArea: LocationAreaInterface) {
    delete locArea.modulo;

    this.updateLocationArea(locArea, true);
  }

  selectConModulo() {
    this.isAllModulesSelected()
      ? this.clearSelection()
      : this.getLocAreaListConModulos().forEach(locArea => {
          if (!this.isSelected(locArea)) {
            this.addPolygonToMap(locArea);
            this.selection.select(locArea);
          }
        });
  }
}
