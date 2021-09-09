import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';

import { Observable, BehaviorSubject, EMPTY, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import Polygon from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';

import { LatLngLiteral } from '@agm/core/map-types';

import { AuthService } from '@core/services/auth.service';
import { GLOBAL } from '@core/services/global';
import { OlMapService } from '@core/services/ol-map.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { PlantaInterface } from '@core/models/planta';
import { CriteriosClasificacion } from '@core/models/criteriosClasificacion';
import { LocationAreaInterface } from '@core/models/location';
import { UserInterface } from '@core/models/user';
import { ModuloInterface } from '@core/models/modulo';
import { PcInterface } from '@core/models/pc';
import { UserAreaInterface } from '@core/models/userArea';
import { CritCriticidad } from '@core/models/critCriticidad';
import { Anomalia } from '@core/models/anomalia';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class PlantaService {
  public planta$: Observable<PlantaInterface>;
  public planta: PlantaInterface;
  private currentPlantId = '';
  public currentPlantId$ = new BehaviorSubject<string>(this.currentPlantId);
  private plantaDoc: AngularFirestoreDocument<PlantaInterface>;
  public plantasCollection: AngularFirestoreCollection<PlantaInterface>;
  public modulos: ModuloInterface[];
  private filteredLocAreasSource = new BehaviorSubject<LocationAreaInterface[]>(new Array<LocationAreaInterface>());
  public currentFilteredLocAreas$ = this.filteredLocAreasSource.asObservable();
  public locAreaList: LocationAreaInterface[];

  constructor(
    private afs: AngularFirestore,
    public auth: AuthService,
    private activatedRoute: ActivatedRoute,
    private olMapService: OlMapService
  ) {
    this.currentPlantId = this.activatedRoute.snapshot.paramMap.get('id');
    this.currentPlantId$.next(this.currentPlantId);

    this.getModulos().subscribe((modulos) => {
      this.modulos = modulos;
    });
  }

  getPlanta(plantaId: string): Observable<PlantaInterface> {
    this.plantaDoc = this.afs.doc<PlantaInterface>('plantas/' + plantaId);

    return (this.planta$ = this.plantaDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as PlantaInterface;
          data.id = action.payload.id;
          return data;
        }
      })
    ));
  }

  getCurrentPlant(): Observable<PlantaInterface> {
    this.plantaDoc = this.afs.doc<PlantaInterface>('plantas/' + this.currentPlantId);

    return this.plantaDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as PlantaInterface;
          data.id = action.payload.id;
          return data;
        }
      })
    );
  }

  addPlanta(planta: PlantaInterface): void {
    planta.id = this.afs.createId();

    this.afs
      .collection('plantas')
      .doc(planta.id)
      .set(planta)
      .then((docRef) => {
        console.log('Planta creada con ID: ', planta.id);
      })
      .catch((error) => {
        console.error('Error al crear planta: ', error);
      });
  }

  updatePlanta(planta: PlantaInterface): void {
    const plantaDoc = this.afs.doc(`plantas/${planta.id}`);
    plantaDoc.update(planta);
  }

  getPlantas() {
    return this.plantasCollection.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as PlantaInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getAllPlantas(): Observable<PlantaInterface[]> {
    return this.afs.collection('plantas').valueChanges();
  }

  addUserArea(plantaId: string, userArea: UserAreaInterface) {
    const id = this.afs.createId();
    userArea.id = id;

    this.afs.collection('plantas').doc(plantaId).collection('userAreas').doc(id).set(userArea);

    return userArea;
  }
  updateUserArea(userArea: UserAreaInterface) {
    const userAreaDoc = this.afs.doc(`plantas/${userArea.plantaId}/userAreas/${userArea.id}`);
    userAreaDoc.update(userArea);
  }

  getAllUserAreas(plantaId: string): Observable<UserAreaInterface[]> {
    const query$ = this.afs.collection('plantas').doc(plantaId).collection('userAreas');

    const result = query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as LocationAreaInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );

    return result;
  }

  getUserAreas$(plantaId: string): Observable<UserAreaInterface[]> {
    return this.auth.user$.pipe(
      map((user) => {
        return user.uid;
      }),
      switchMap((userId) => {
        return this.afs
          .collection<UserAreaInterface>(`plantas/${plantaId}/userAreas/`, (ref) => ref.where('userId', '==', userId))
          .valueChanges();
      })
    );
  }

  async delUserArea(userArea: UserAreaInterface) {
    return this.afs.collection('plantas').doc(userArea.plantaId).collection('userAreas').doc(userArea.id).delete();
  }

  async addLocationArea(plantaId: string, locationArea: LocationAreaInterface) {
    const id = this.afs.createId();
    locationArea.id = id;

    return this.afs.collection('plantas').doc(plantaId).collection('locationAreas').doc(id).set(locationArea);
  }

  async updateLocationArea(locArea: LocationAreaInterface) {
    const LocAreaDoc = this.afs.doc(`plantas/${locArea.plantaId}/locationAreas/${locArea.id}`);

    return LocAreaDoc.set(locArea);
  }

  delLocationArea(locationArea: LocationAreaInterface) {
    this.afs.collection('plantas').doc(locationArea.plantaId).collection('locationAreas').doc(locationArea.id).delete();
  }

  getLocationsArea(plantaId: string): Observable<LocationAreaInterface[]> {
    const query$ = this.afs.collection('plantas').doc(plantaId).collection('locationAreas');

    const result = query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as LocationAreaInterface;
          data.id = a.payload.doc.id;

          // generamos las globalCoords en caso de que no tenga
          if (data.globalCoords === undefined) {
            data.globalCoords = [data.globalX, data.globalY];
          }

          return data;
        })
      )
    );

    return result;
  }

  getUniqueLargestLocAreas(locAreas: LocationAreaInterface[]): LocationAreaInterface[] {
    return locAreas.filter(
      (locA, index, locAs) => locAs.map((loc) => loc.globalCoords[0]).indexOf(locA.globalCoords[0]) === index
    );
  }

  getGlobalCoords(locArea: LocationAreaInterface): any[] {
    return [locArea.globalX, locArea.globalY, null];
  }

  getPlantasDeEmpresa(user: UserInterface): Observable<PlantaInterface[]> {
    let query$: AngularFirestoreCollection<PlantaInterface>;
    if (user.role === 2) {
      query$ = this.afs.collection<PlantaInterface>('plantas');
      return query$.snapshotChanges().pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as PlantaInterface;
            data.id = a.payload.doc.id;
            return data;
          })
        ),
        map((plantas) => {
          return plantas.filter((planta) => {
            return user.plantas.includes(planta.id);
          });
        })
      );
    } else if (this.auth.userIsAdmin(user)) {
      query$ = this.afs.collection<PlantaInterface>('plantas');
    } else {
      query$ = this.afs.collection<PlantaInterface>('plantas', (ref) => ref.where('empresa', '==', user.uid));
    }

    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as PlantaInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getModulosPlanta(planta: PlantaInterface): ModuloInterface[] {
    if (planta.hasOwnProperty('modulos')) {
      if (planta.modulos.length > 0) {
        return this.modulos.filter((item) => {
          return planta.modulos.indexOf(item.id) >= 0;
        });
      }
    }
    return this.modulos;
  }

  getModulos(): Observable<ModuloInterface[]> {
    let query$: AngularFirestoreCollection<ModuloInterface>;

    query$ = this.afs.collection<ModuloInterface>('modulos');

    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as ModuloInterface;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getNumeroModulo(elem: PcInterface | Anomalia, type?: string, planta?: PlantaInterface): string {
    if (planta === undefined) {
      planta = this.planta;
    }

    let localX = (elem as PcInterface).local_x;
    let localY = (elem as PcInterface).local_y;
    if (type === 'anomalia') {
      localX = (elem as Anomalia).localX;
      localY = (elem as Anomalia).localY;
    }

    const altura = this.getAltura(planta, localY);

    if (
      planta.hasOwnProperty('etiquetasLocalXY') &&
      planta.etiquetasLocalXY[altura] !== undefined &&
      planta.etiquetasLocalXY[altura][localX - 1] !== undefined
    ) {
      return planta.etiquetasLocalXY[altura][localX - 1];
    }

    return this.getEtiquetaLocalX(planta, elem, type).concat('/').concat(this.getEtiquetaLocalY(planta, elem, type));
  }

  getAltura(planta: PlantaInterface, localY: number) {
    // Por defecto, la altura alta es la numero 1
    if (planta.alturaBajaPrimero) {
      return planta.filas - (localY - 1);
    } else {
      return localY;
    }
  }

  getEtiquetaLocalX(planta: PlantaInterface, elem: PcInterface | Anomalia, type?: string): string {
    let localX = (elem as PcInterface).local_x;
    if (type === 'anomalia') {
      localX = (elem as Anomalia).localX;
    }

    if (localX <= 0) {
      return GLOBAL.stringParaDesconocido;
    }
    if (planta.hasOwnProperty('etiquetasLocalX')) {
      const newLocalX = localX > planta.etiquetasLocalX.length ? planta.etiquetasLocalX.length : localX;
      return planta.etiquetasLocalX[newLocalX - 1];
    }
    return localX.toString();
  }

  getEtiquetaLocalY(planta: PlantaInterface, elem: PcInterface | Anomalia, type?: string): string {
    let localY = (elem as PcInterface).local_y;
    if (type === 'anomalia') {
      localY = (elem as Anomalia).localY;
    }

    if (localY <= 0) {
      return GLOBAL.stringParaDesconocido;
    }
    if (planta.hasOwnProperty('etiquetasLocalY')) {
      const newLocalY = localY > planta.etiquetasLocalY.length ? planta.etiquetasLocalY.length : localY;
      if (planta.alturaBajaPrimero) {
        return planta.etiquetasLocalY[newLocalY - 1];
      }
      return planta.etiquetasLocalY[planta.etiquetasLocalY.length - newLocalY];
    }
    return this.getAltura(planta, localY).toString();
  }

  getNombreSeguidor(pc: PcInterface) {
    let nombreSeguidor = '';
    if (pc.hasOwnProperty('global_x')) {
      if (!Number.isNaN(pc.global_x) && pc.global_x !== null) {
        nombreSeguidor = nombreSeguidor.concat(pc.global_x.toString());
      }
    }
    if (pc.hasOwnProperty('global_y')) {
      if (!Number.isNaN(pc.global_y) && pc.global_y !== null) {
        if (nombreSeguidor.length > 0) {
          nombreSeguidor = nombreSeguidor.concat(this.getGlobalsConector());
        }
        nombreSeguidor = nombreSeguidor.concat(pc.global_y.toString());
      }
    }
    if (pc.hasOwnProperty('global_z')) {
      if (!Number.isNaN(pc.global_z) && pc.global_z !== null) {
        if (nombreSeguidor.length > 0) {
          nombreSeguidor = nombreSeguidor.concat(this.getGlobalsConector());
        }
        nombreSeguidor = nombreSeguidor.concat(pc.global_z.toString());
      }
    }
    return nombreSeguidor;
  }

  getEtiquetaGlobals(pc: PcInterface): string {
    let nombreEtiqueta = '';
    if (pc.hasOwnProperty('global_x') && !Number.isNaN(pc.global_x) && pc.global_x !== null) {
      nombreEtiqueta = nombreEtiqueta.concat(pc.global_x.toString());
    }
    if (pc.hasOwnProperty('global_y') && !Number.isNaN(pc.global_y) && pc.global_y !== null) {
      if (nombreEtiqueta.length > 0) {
        nombreEtiqueta = nombreEtiqueta.concat(this.getGlobalsConector());
      }
      nombreEtiqueta = nombreEtiqueta.concat(pc.global_y.toString());
    }
    return nombreEtiqueta;
  }

  getGlobalCoordsColumns(planta: PlantaInterface, columnsToDisplay: string[]): string[] {
    if (planta.tipo === 'seguidores') {
      let count = 0;
      if (planta.hasOwnProperty('nombreGlobalX')) {
        count += 1;
        columnsToDisplay.push('global_x');
      }
      if (planta.hasOwnProperty('nombreGlobalY')) {
        count += 1;
        columnsToDisplay.push('global_y');
      }
      if (planta.hasOwnProperty('nombreGlobalZ')) {
        count += 1;
        columnsToDisplay.push('global_z');
      }
      if (count === 0) {
        columnsToDisplay.push('seguidor');
      }
    } else {
      columnsToDisplay.push('global_x');
      if (planta.hasOwnProperty('numeroGlobalCoords')) {
        if (planta.numeroGlobalCoords >= 2) {
          columnsToDisplay.push('global_y');
        }
        // if (planta.numeroGlobalCoords === 3) {
        //   columnsToDisplay.push('global_z');
        // }
      } else {
        columnsToDisplay.push('global_y');
      }
    }
    return columnsToDisplay;
  }

  getGlobalsConector(): string {
    if (this.planta.hasOwnProperty('stringConectorGlobals')) {
      return this.planta.stringConectorGlobals;
    }

    return GLOBAL.stringConectorGlobalsDefault;
  }

  getNombreColsGlobal(planta: PlantaInterface) {
    let nombreCol = this.getNombreGlobalX(planta);
    if (nombreCol.length > 0) {
      nombreCol = nombreCol.concat(this.getGlobalsConector());
    }
    nombreCol = nombreCol.concat(this.getNombreGlobalY(planta));
    // let nombreCol = "";
    // if (planta.hasOwnProperty("nombreGlobalX")) {
    //   nombreCol = nombreCol.concat(planta.nombreGlobalX.toString());
    // }
    // if (planta.hasOwnProperty("nombreGlobalY")) {
    //   if (nombreCol.length > 0) {
    //     nombreCol = nombreCol.concat("/");
    //   }
    //   nombreCol = nombreCol.concat(planta.nombreGlobalY.toString());
    // }
    // if (nombreCol.length === 0) {
    //   nombreCol = "Pasillo"
    // }
    return nombreCol;
  }

  getReferenciaSolardrone(planta: PlantaInterface) {
    return !planta.hasOwnProperty('referenciaSolardrone') || planta.referenciaSolardrone;
  }

  getCriterios(): Observable<CriteriosClasificacion[]> {
    let query$: AngularFirestoreCollection<CriteriosClasificacion>;

    query$ = this.afs.collection<CriteriosClasificacion>('criteriosClasificacion');

    return query$.snapshotChanges().pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as CriteriosClasificacion;
          data.id = a.payload.doc.id;
          return data;
        })
      )
    );
  }

  getCriterio(criterioId: string): Observable<CriteriosClasificacion> {
    const criterioDoc = this.afs.doc<CriteriosClasificacion>('criteriosClasificacion/' + criterioId);

    return criterioDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as CriteriosClasificacion;
          data.id = action.payload.id;
          return data;
        }
      })
    );
  }

  getCriterioCriticidad(criterioId: string): Observable<CritCriticidad> {
    const criterioDoc = this.afs.doc<CriteriosClasificacion>('criteriosCriticidad/' + criterioId);

    return criterioDoc.snapshotChanges().pipe(
      map((action) => {
        if (action.payload.exists === false) {
          return null;
        } else {
          const data = action.payload.data() as CritCriticidad;
          data.id = action.payload.id;
          return data;
        }
      })
    );
  }

  set(planta: PlantaInterface) {
    this.planta = planta;
  }
  get() {
    return this.planta;
  }
  getNombreGlobalX(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalX')) {
        return planta.nombreGlobalX;
      }
      return GLOBAL.nombreGlobalXFija;
    }
    return '';
  }
  getNombreGlobalY(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalY')) {
        return planta.nombreGlobalY;
      }
      return GLOBAL.nombreGlobalYFija;
    }
    return '';
  }

  setLocAreaListFromPlantaId(plantaId: string): void {
    const locAreaList = [];
    this.getLocationsArea(plantaId)
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
          locAreaList.push(polygon);
          if (locAreaList.length === locAreaArray.length) {
            this.setLocAreaList(locAreaList);
          }
        });
      });
  }

  setLocAreaListFromPlantaIdOl(plantaId: string): void {
    const locAreaList = [];
    this.getLocationsArea(plantaId)
      .pipe(take(1))
      .subscribe((locAreaArray) => {
        locAreaArray.forEach((locationArea) => {
          // const polygon = new Polygon(this.olMapService.latLonLiteralToLonLat(locationArea.path));
          const polygon = {
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
          };
          locAreaList.push(polygon);
          if (locAreaList.length === locAreaArray.length) {
            this.setLocAreaList(locAreaList);
          }
        });
      });
  }

  getNombreGlobalZ(planta: PlantaInterface): string {
    if (planta.tipo !== '2 ejes') {
      if (planta.hasOwnProperty('nombreGlobalZ')) {
        return planta.nombreGlobalZ;
      }
      return GLOBAL.nombreGlobalZFija;
    }
    return '';
  }
  getNombreLocalX(planta: PlantaInterface): string {
    if (planta.hasOwnProperty('nombreLocalX')) {
      return planta.nombreLocalX;
    }
    return GLOBAL.nombreLocalXFija;
  }

  getNombreLocalY(planta: PlantaInterface): string {
    if (planta.hasOwnProperty('nombreLocalY')) {
      return planta.nombreLocalY;
    }
    return GLOBAL.nombreLocalYFija;
  }
  setLocAreaList(locAreaList: LocationAreaInterface[]) {
    this.locAreaList = locAreaList;
  }

  getGlobalCoordsFromLocationArea(coords: LatLngLiteral) {
    const latLng = new google.maps.LatLng(coords.lat, coords.lng);

    const globalCoords = [null, null, null];
    let modulo: ModuloInterface = {};

    if (this.locAreaList !== undefined) {
      this.locAreaList.forEach((polygon, i, array) => {
        if (google.maps.geometry.poly.containsLocation(latLng, polygon)) {
          if (polygon.globalX !== undefined && polygon.globalX !== null && polygon.globalX !== '') {
            globalCoords[0] = polygon.globalX;
          }
          if (polygon.globalY !== undefined && polygon.globalY !== null && polygon.globalY !== '') {
            globalCoords[1] = polygon.globalY;
          }
          if (polygon.hasOwnProperty('globalCoords') && polygon.globalCoords !== undefined) {
            polygon.globalCoords.forEach((item, index) => {
              if (item !== null && item !== undefined && item !== '') {
                globalCoords[index] = item;
              }
            });
          }

          if (polygon.hasOwnProperty('modulo')) {
            if (polygon.modulo !== undefined) {
              modulo = polygon.modulo;
            }
          }
        }
      });
    }

    return [globalCoords, modulo];
  }

  getGlobalCoordsFromLocationAreaOl(coords: Coordinate) {
    const globalCoords = [null, null, null];

    if (this.locAreaList !== undefined) {
      this.locAreaList.forEach((locArea) => {
        const polygon = new Polygon(this.olMapService.latLonLiteralToLonLat((locArea as any).paths));

        if (polygon.intersectsCoordinate(coords)) {
          if (locArea.globalX.length > 0) {
            globalCoords[0] = locArea.globalX;
          }
          if (locArea.globalY.length > 0) {
            globalCoords[1] = locArea.globalY;
          }
          if (locArea.hasOwnProperty('globalCoords') && locArea.globalCoords !== undefined) {
            locArea.globalCoords.forEach((item, index) => {
              if (item !== null && item.length > 0) {
                globalCoords[index] = item;
              }
            });
          }
        }
      });
    }

    return globalCoords;
  }

  initMap(planta: PlantaInterface, map: any) {
    if (planta.hasOwnProperty('ortofoto')) {
      const ortofoto = planta.ortofoto;
      map.setOptions({ maxZoom: ortofoto.mapMaxZoom });
      map.setOptions({ minZoom: ortofoto.mapMinZoom });
      map.mapTypeId = 'roadmap';
      const mapBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(ortofoto.bounds.south, ortofoto.bounds.west),
        new google.maps.LatLng(ortofoto.bounds.north, ortofoto.bounds.east)
      );

      const imageMapType = new google.maps.ImageMapType({
        getTileUrl(coord, zoom) {
          const proj = map.getProjection();
          const z2 = Math.pow(2, zoom);
          const tileXSize = 256 / z2;
          const tileYSize = 256 / z2;
          const tileBounds = new google.maps.LatLngBounds(
            proj.fromPointToLatLng(new google.maps.Point(coord.x * tileXSize, (coord.y + 1) * tileYSize)),
            proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * tileXSize, coord.y * tileYSize))
          );
          if (!mapBounds.intersects(tileBounds) || zoom < ortofoto.mapMinZoom || zoom > ortofoto.mapMaxZoom) {
            return null;
          }
          // return `${ortofoto.url}/${zoom}/${coord.x}/${coord.y}.png`;
          return 'https://solardrontech.es/tileserver.php?/index.json?/kyswupn4T2GXardoZorv_visual/{z}/{x}/{y}.png'
            .replace('{z}', zoom)
            .replace('{x}', coord.x)
            .replace('{y}', coord.y);
        },
        tileSize: new google.maps.Size(256, 256),
        name: 'Tiles',
      });

      map.overlayMapTypes.push(imageMapType);
      map.fitBounds(mapBounds);
    }
  }

  loadOrtoImage(planta: PlantaInterface, map: any) {
    var mapBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(planta.latitud - 0.02, planta.longitud - 0.02),
      new google.maps.LatLng(planta.latitud + 0.02, planta.longitud + 0.02)
    );
    var mapMinZoom = 12;
    var mapMaxZoom = 24;
    // var opts = {
    //   streetViewControl: false,
    //   tilt: 0,
    //   mapTypeId: google.maps.MapTypeId.HYBRID,
    //   center: new google.maps.LatLng(0, 0),
    //   zoom: mapMinZoom,
    // };
    // var map = new google.maps.Map(document.getElementById('map'), opts);

    map.mapTypeId = 'roadmap';
    map.setOptions({ maxZoom: mapMaxZoom });
    map.setOptions({ minZoom: mapMinZoom });

    // https://developers.google.com/maps/documentation/javascript/examples/maptype-image-overlay
    const imageMapType = new google.maps.ImageMapType({
      getTileUrl(coord, zoom) {
        const proj = map.getProjection();
        var z2 = Math.pow(2, zoom);
        var tileXSize = 256 / z2;
        var tileYSize = 256 / z2;
        var tileBounds = new google.maps.LatLngBounds(
          proj.fromPointToLatLng(new google.maps.Point(coord.x * tileXSize, (coord.y + 1) * tileYSize)),
          proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * tileXSize, coord.y * tileYSize))
        );
        if (!mapBounds.intersects(tileBounds) || zoom < mapMinZoom || zoom > mapMaxZoom) return null;
        return 'https://solardrontech.es/tileserver.php?/index.json?/kyswupn4T2GXardoZorv_visual/{z}/{x}/{y}.png'
          .replace('{z}', zoom)
          .replace('{x}', coord.x)
          .replace('{y}', coord.y);
      },
      tileSize: new google.maps.Size(256, 256),
      minZoom: mapMinZoom,
      maxZoom: mapMaxZoom,
      name: 'Tiles',
    });

    map.overlayMapTypes.push(imageMapType);
    map.fitBounds(mapBounds);
  }

  getThermalLayers$(plantaId: string): Observable<ThermalLayerInterface[]> {
    const query$ = this.afs
      .collection<ThermalLayerInterface>('thermalLayers', (ref) => ref.where('plantaId', '==', plantaId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((doc) => {
            let data = doc.payload.doc.data() as ThermalLayerInterface;
            data.id = doc.payload.doc.id;
            return data;
          })
        )
      );
    return query$;
  }
}
