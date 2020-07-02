import { Component, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlantaService } from 'src/app/services/planta.service';
import { PlantaInterface } from '../../models/planta';
import { LocationAreaInterface } from 'src/app/models/location';
import { LatLngLiteral } from '@agm/core/map-types';
import { Observable } from 'rxjs';
import { AgmPolygon, AgmMap } from '@agm/core';
import { ModuloInterface } from '../../models/modulo';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { UserAreaInterface } from '../../models/userArea';
import { AreaInterface } from '../../models/area';
import { GLOBAL } from 'src/app/services/global';
import { MatPaginator } from '@angular/material/paginator';
declare const google: any;

@Component({
  selector: 'app-auto-loc',
  templateUrl: './auto-loc.component.html',
  styleUrls: ['./auto-loc.component.css'],
})
export class AutoLocComponent implements OnInit {
  @ViewChildren(AgmPolygon) polygonData: QueryList<AgmPolygon>;
  @ViewChild(AgmMap, { static: true }) map: any;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  public planta: PlantaInterface;
  public defaultZoom: number;
  public mapType: string;
  public plantaLocation: LatLngLiteral;
  public plantaId: string;
  public selectedLocationArea: LocationAreaInterface;
  public selectedUserArea: UserAreaInterface;
  public locationAreaList: LocationAreaInterface[];
  public locationAreaList$: Observable<LocationAreaInterface[]>;
  public userAreaList: UserAreaInterface[];
  public userAreaList$: Observable<UserAreaInterface[]>;
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
  public userAreaDataSource: MatTableDataSource<UserAreaInterface>;
  public moduloSelecLista: ModuloInterface;
  public isUserArea: boolean;
  public global = GLOBAL;
  public alertMessage: string;
  public successMessage: string;
  public lastGlobalChanged: string;

  constructor(private route: ActivatedRoute, private plantaService: PlantaService) {}

  ngOnInit() {
    this.mapType = 'satellite';
    this.defaultZoom = 18;
    this.plantaLocation = { lng: -5.880743, lat: 39.453186 };
    this.isUserArea = false;
    this.lastGlobalChanged = 'global1';

    this.plantaId = this.route.snapshot.paramMap.get('id');
    this.getPlanta(this.plantaId);
    this.polygonList = [];
    this.minPolygonsVisibles = 30;
    this.maxPolygonsVisibles = 1000;
    this.polygonsAllHidden = false;
    this.lastLocationArea = undefined;
    this.displayedColumns = ['select', 'globalCoords', 'modulo'];

    this.locAreaDataSource = new MatTableDataSource([]);
    this.locAreaDataSource.paginator = this.paginator;
    this.userAreaDataSource = new MatTableDataSource([]);
    this.locAreaDataSource.sortData = (data, sort: MatSort) => {
      if (sort.active === 'globalX') {
        data.sort(this.sortByGlobalX);
      }
      return data;
    };
    this.userAreaDataSource.sortData = (data, sort: MatSort) => {
      if (sort.active === 'userId') {
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
    this.locationAreaList$ = this.plantaService.getLocationsArea(this.plantaId);
    this.userAreaList$ = this.plantaService.getAllUserAreas(this.plantaId);
    this.locationAreaList$.subscribe((list) => {
      list.forEach((item) => {
        delete item.visible;
      });
      this.locationAreaList = list;
      this.locAreaDataSource.data = list;
    });
    this.userAreaList$.subscribe((list) => {
      list.forEach((item) => {
        delete item.visible;
      });
      this.userAreaList = list;
      this.userAreaDataSource.data = list;
    });

    const initialSelection = [];
    const allowMultiSelect = true;
    this.selection = new SelectionModel<LocationAreaInterface>(allowMultiSelect, initialSelection);

    window.addEventListener('online', (e) => (this.alertMessage = undefined));
    window.addEventListener('offline', (e) => (this.alertMessage = 'ERROR Internet conection'));
  }

  getPlanta(plantaId: string) {
    this.plantaService.getPlanta(plantaId).subscribe(
      (response) => {
        this.planta = response;
        this.defaultZoom = this.planta.zoom;
        this.plantaLocation.lat = this.planta.latitud;
        this.plantaLocation.lng = this.planta.longitud;
        this.modulos = this.plantaService.getModulosPlanta(response);
      },
      (error) => {
        const errorMessage = error as any;
        if (errorMessage != null) {
          console.log(error);
        }
      }
    );
  }

  onMapReady(map) {
    console.log('mapready');
    this.initDrawingManager(map);
  }

  private addPolygonToMap(area: AreaInterface, isNew = false) {
    // area.visible = true;
    this.map._mapsWrapper
      .createPolygon({
        paths: area.path,
        strokeColor: area.hasOwnProperty('modulo') ? 'yellow' : 'white',
        strokeOpacity: this._strokeOpacity,
        strokeWeight: 2,
        fillColor: this.getFillColor(area),
        fillOpacity: this._fillOpacity,
        editable: isNew,
        draggable: isNew,
        id: area.id,
      })
      .then((polygon: any) => {
        this.polygonList.push(polygon);
        if (isNew) {
          this.selectArea(area);
        }

        google.maps.event.addListener(polygon, 'mouseup', (event) => {
          this.selectArea(area);
          this.modifyArea(area);
        });
      });
  }

  private modifyArea(area: AreaInterface) {
    const polygon = this.polygonList.find((item) => {
      return item.id === area.id;
    });
    const vertices = polygon.getPath();
    // Iterate over the vertices.
    const newPath: LatLngLiteral[] = [];
    for (let i = 0; i < vertices.getLength(); i++) {
      const xy = vertices.getAt(i);
      newPath.push({ lat: xy.lat(), lng: xy.lng() });
    }
    area.path = newPath;
    this.updateArea(area);
  }

  public selectArea(area: AreaInterface) {
    this.selectedLocationArea = undefined;
    this.selectedUserArea = undefined;

    if (this.selectedPolygon !== undefined) {
      this.selectedPolygon.setOptions({
        fillColor: this.getFillColor(area),
        editable: false,
        draggable: false,
      });
    }

    const polygon = this.polygonList.find((item) => {
      return item.id === area.id;
    });

    if (polygon === undefined) {
      this.addPolygonToMap(area);
    } else {
      polygon.setOptions({
        fillColor: 'white',
        editable: true,
        draggable: true,
      });
    }
    this.selectedPolygon = polygon;
    if (this.checkIfUserArea(area)) {
      this.selectedUserArea = area as UserAreaInterface;
    } else {
      this.selectedLocationArea = area as LocationAreaInterface;
      this.selection.select(area as LocationAreaInterface);
    }
  }

  initDrawingManager(map: any) {
    const options = {
      drawingControl: true,
      drawingControlOptions: {
        drawingModes: ['polygon', 'rectangle'],
      },
      polygonOptions: {
        draggable: true,
        editable: true,
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    };

    const drawingManager = new google.maps.drawing.DrawingManager(options);
    drawingManager.setMap(map);

    this.addEventListeners(drawingManager);
  }
  deleteArea(area: AreaInterface) {
    // Eliminar del mapa
    const polygon = this.polygonList.find((item) => {
      return item.id === area.id;
    });
    polygon.setMap(null);
    this.polygonList = this.polygonList.filter((item) => item.id !== polygon.id);

    // Eliminar de la BD
    this.deleteAreaFromDb(area);
  }

  copyArea(area: LocationAreaInterface) {
    this.createLocArea(area.path);
  }

  checkIfUserArea(area: AreaInterface) {
    return 'userId' in area;
  }

  deleteAreaFromDb(area: AreaInterface) {
    if (this.checkIfUserArea(area)) {
      // UserAreaInterface
      this.plantaService.delUserArea(area as UserAreaInterface);
    } else {
      // LocationAreaInterface
      this.plantaService.delLocationArea(area as LocationAreaInterface);
    }
  }

  updateAreaFromGlobals(area: AreaInterface, gc: number) {
    this.lastGlobalChanged = 'global'.concat(gc.toString());
    this.updateArea(area);
  }

  updateArea(area: AreaInterface, moduleChange = false) {
    if (this.checkIfUserArea(area)) {
      this.plantaService.updateUserArea(area as UserAreaInterface);
    } else {
      this.plantaService
        .updateLocationArea(area as LocationAreaInterface)
        .then((res) => {
          this.alertMessage = undefined;
        })
        .catch((res) => {
          console.log('AutoLocComponent -> updateArea -> res', res);
          this.alertMessage = 'ERROR';
        });

      if (moduleChange) {
        this.changeVisibilityPolygon(area as LocationAreaInterface);
        this.changeVisibilityPolygon(area as LocationAreaInterface);
      }
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
    const locAreasYDistancias = [];
    if (this.lastLocationArea) {
      this.locationAreaList.forEach((locArea) => {
        locAreasYDistancias.push({
          locArea,
          distancia: this.calculateDistance(this.lastLocationArea, locArea),
        });
      });
      locAreasYDistancias.sort(this.sortByDistancia);

      // Ocultar todos
      this.showOrHideAllPolygons(true);
      // 1 - ordenamos por distacia

      let contarMaxPoylgonsVisibles = 0;
      locAreasYDistancias.forEach((locAreaYDist) => {
        const locArea = locAreaYDist.locArea;
        contarMaxPoylgonsVisibles += 1;
        if (contarMaxPoylgonsVisibles <= this.minPolygonsVisibles) {
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
      this.polygonsAllHidden = false;
      this.locationAreaList.forEach((locArea) => {
        this.changeVisibilityPolygon(locArea);
      });
    } else {
      this.polygonsAllHidden = true;
      this.polygonList.forEach((polygon) => {
        polygon.setMap(null);
      });
      this.polygonList = [];
    }
  }

  changeVisibilityPolygon(locArea: LocationAreaInterface, fromCheckbox = false) {
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
    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon) => {
      polygon.setMap(null);
      const path: LatLngLiteral[] = [];
      for (let i = 0; i < polygon.getPath().getLength(); i++) {
        path.push({
          lat: polygon.getPath().getAt(i).lat() as number,
          lng: polygon.getPath().getAt(i).lng() as number,
        });
      }
      if (this.isUserArea) {
        this.createUserArea(path);
      } else {
        this.createLocArea(path);
      }
    });
    google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle) => {
      rectangle.setMap(null);
      const path: LatLngLiteral[] = [];
      const bounds = rectangle.getBounds();
      const getNorthEast = bounds.getNorthEast();
      const getSouthWest = bounds.getSouthWest();

      path.push({ lat: getNorthEast.lat(), lng: getNorthEast.lng() });
      path.push({ lat: getNorthEast.lat(), lng: getSouthWest.lng() });
      path.push({ lat: getSouthWest.lat(), lng: getSouthWest.lng() });
      path.push({ lat: getSouthWest.lat(), lng: getNorthEast.lng() });

      if (this.isUserArea) {
        this.createUserArea(path);
      } else {
        this.createLocArea(path);
      }
    });
  }

  private createUserArea(path: LatLngLiteral[]) {
    let userArea = {} as UserAreaInterface;
    userArea.plantaId = this.plantaId;
    userArea.userId = '';
    userArea.path = path;

    userArea = this.plantaService.addUserArea(this.plantaId, userArea);
    this.userAreaList.push(userArea);
    // this.selectArea(userArea);

    this.addPolygonToMap(userArea, true);
  }

  private createLocArea(path: LatLngLiteral[]) {
    const locationArea = {
      path,
      globalX: '',
      globalY: '',
      plantaId: this.plantaId,
      globalCoords: [null, null, null],
    } as LocationAreaInterface;

    this.plantaService
      .addLocationArea(this.plantaId, locationArea)
      .then(() => {
        this.successMessage = 'Area añadida - OK';
        setTimeout(() => {
          this.successMessage = undefined;
        }, 2000);
        this.alertMessage = undefined;
        document.getElementById(this.lastGlobalChanged).focus();
      })
      .catch((res) => {
        console.log('ERROR', res);
        this.alertMessage = 'ERROR';
      });
    this.locationAreaList.push(locationArea);
    // this.selectArea(locationArea);

    this.lastLocationArea = locationArea;
    this.addPolygonToMap(locationArea, true);
  }

  getRowColor(locArea: LocationAreaInterface) {
    return locArea.hasOwnProperty('modulo') ? 'yellow' : 'black';
  }
  getFillColor(area: AreaInterface) {
    if (this.checkIfUserArea(area)) {
      return 'green';
    } else {
      return this.getFillColorLocArea(area as LocationAreaInterface);
    }
  }

  getFillColorLocArea(locArea: LocationAreaInterface) {
    if (locArea.hasOwnProperty('modulo')) {
      return 'grey';
    }
    if (locArea.hasOwnProperty('globalCoords')) {
      if (this.validateGlobalCoords(locArea.globalCoords)) {
        return 'grey';
      } else {
        return 'red';
      }
    } else {
      if (locArea.globalX.length > 0) {
        return 'green';
      } else if (locArea.globalY.length > 0) {
        return 'blue';
      }
      return 'grey';
    }
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
    return this.locationAreaList.filter((locArea) => {
      if (locArea.hasOwnProperty('modulo')) {
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
      : this.locAreaDataSource.filteredData.forEach((locArea) => {
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
      this.selection.selected.forEach((locArea) => {
        if (this.moduloSelecLista) {
          locArea.modulo = this.moduloSelecLista;
          this.updateArea(locArea, true);
        }
      });
    }
  }

  onSelectCheckbox(event, locArea: LocationAreaInterface) {
    this.changeVisibilityPolygon(locArea, true);
  }

  onSelectCheckboxChange(event, locArea: LocationAreaInterface) {
    event.stopPropagation();
    this.changeVisibilityPolygon(locArea, true);
  }

  isSelected(locArea: LocationAreaInterface) {
    const exists = this.selection.selected.find((item) => {
      return item.id === locArea.id;
    });

    return exists !== undefined;
  }
  clearModulo(locArea: LocationAreaInterface) {
    delete locArea.modulo;

    this.updateArea(locArea, true);
  }

  selectConModulo() {
    this.isAllModulesSelected()
      ? this.clearSelection()
      : this.getLocAreaListConModulos().forEach((locArea) => {
          if (!this.isSelected(locArea)) {
            this.addPolygonToMap(locArea);
            this.selection.select(locArea);
          }
        });
  }

  validateGlobalCoords(globalCoords) {
    globalCoords = globalCoords.map((element) => {
      return element === null ? '' : element;
    });
    if (
      globalCoords[0].toString().length === 0 &&
      globalCoords[1].toString().length === 0 &&
      globalCoords[2].toString().length === 0
    ) {
      return false;
    } else {
      return true;
    }
  }
}
