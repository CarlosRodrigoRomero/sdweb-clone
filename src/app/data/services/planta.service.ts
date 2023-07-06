import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';

import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import Polygon from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';

import { LatLngLiteral } from '@agm/core/map-types';

declare const google: any;

import { AuthService } from '@data/services/auth.service';
import { OlMapService } from '@data/services/ol-map.service';
import { GeoserverService } from './geoserver.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { PlantaInterface } from '@core/models/planta';
import { CriteriosClasificacion } from '@core/models/criteriosClasificacion';
import { LocationAreaInterface } from '@core/models/location';
import { UserInterface } from '@core/models/user';
import { ModuloInterface } from '@core/models/modulo';
import { UserAreaInterface } from '@core/models/userArea';
import { CritCriticidad } from '@core/models/critCriticidad';
import { InformeInterface } from '@core/models/informe';

import { Translation } from '@shared/utils/translations/translations';

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
  private translation: Translation;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private afs: AngularFirestore,
    public auth: AuthService,
    private activatedRoute: ActivatedRoute,
    private olMapService: OlMapService,
    private geoserverService: GeoserverService
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
          data.zoom = this.getZoomPlanta(data);

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
          data.zoom = this.getZoomPlanta(data);

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

  updateLocationAreaField(locArea: LocationAreaInterface, field: string, value: any) {
    const tempLocArea = {};
    tempLocArea[field] = value;

    this.afs
      .doc(`plantas/${locArea.plantaId}/locationAreas/${locArea.id}`)
      .update(tempLocArea)
      .then(() => console.log('LocArea actualizada correctamente!'));
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
      (locA, index, locAs) => locAs.map((loc) => loc.globalCoords[0]).indexOf(locA.globalCoords[0]) === index && locA.globalCoords[0]
    );
  }

  getGlobalCoords(locArea: LocationAreaInterface): any[] {
    return [locArea.globalX, locArea.globalY, null];
  }

  getPlantasDeEmpresa(user: UserInterface): Observable<PlantaInterface[]> {
    let query$: AngularFirestoreCollection<PlantaInterface>;
    if (user.role === 2 && user.plantas !== undefined) {
      query$ = this.afs.collection<PlantaInterface>('plantas');
      return query$.snapshotChanges().pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as PlantaInterface;
            data.id = a.payload.doc.id;
            data.zoom = this.getZoomPlanta(data);

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
    }
    // else if (user.role === 6) {
    //   query$ = this.afs.collection<PlantaInterface>('plantas', (ref) => ref.where('empresa', '==', user.empresaId));

    // } 
    else if (user.empresaId === undefined) {
      //Se buscan las plantas de la empresa con la propiedad empresaId y no con el uid del usuario
      console.log(user.empresaId);
      query$ = this.afs.collection<PlantaInterface>('plantas', (ref) => ref.where('empresa', '==', user.uid));
    }
    else {
      console.log(user.empresaId);
      query$ = this.afs.collection<PlantaInterface>('plantas', (ref) => ref.where('empresa', '==', user.empresaId));
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

  getLabelNombreGlobalCoords(planta: PlantaInterface, language?: string): string {
    this.translation = new Translation(language);

    let label = '';
    if (planta.nombreGlobalCoords.length > 0) {
      if (language) {
        planta.nombreGlobalCoords.forEach((coord, index, coords) => {
          if (index < coords.length - 1) {
            label += this.translation.t(coord) + '.';
          } else {
            label += this.translation.t(coord);
          }
        });
      } else {
        label = planta.nombreGlobalCoords.join('.');
      }
    }

    return label;
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
            path: locationArea.path,
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
          if (polygon.hasOwnProperty('globalCoords') && polygon.globalCoords !== undefined) {
            polygon.globalCoords.forEach((item, index) => {
              if (item !== null && item !== undefined && item !== '') {
                globalCoords[index] = item;
              }
            });
          } else {
            if (polygon.globalX !== undefined && polygon.globalX !== null && polygon.globalX !== '') {
              globalCoords[0] = polygon.globalX;
            }
            if (polygon.globalY !== undefined && polygon.globalY !== null && polygon.globalY !== '') {
              globalCoords[1] = polygon.globalY;
            }
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

  getGlobalCoordsFromLocationAreaOl(coords: Coordinate, locAreaList?: LocationAreaInterface[]) {
    const globalCoords = [null, null, null];

    if (locAreaList !== undefined) {
      this.locAreaList = locAreaList;
    }

    if (this.locAreaList !== undefined) {
      this.locAreaList.forEach((locArea) => {
        const polygon = new Polygon(this.olMapService.latLonLiteralToLonLat(locArea.path));

        if (polygon.intersectsCoordinate(coords)) {
          if (locArea.hasOwnProperty('globalCoords') && locArea.globalCoords !== undefined) {
            locArea.globalCoords.forEach((item, index) => {
              if (item !== null) {
                if (typeof item === 'string' && item.length > 0) {
                  globalCoords[index] = item;
                }
                if (typeof item === 'number') {
                  globalCoords[index] = item;
                }
              }
            });
          } else {
            if (locArea.globalX.length > 0) {
              globalCoords[0] = locArea.globalX;
            }
            if (locArea.globalY.length > 0) {
              globalCoords[1] = locArea.globalY;
            }
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
      map.mapTypeId = 'satellite';
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

  loadOrtoImage(planta: PlantaInterface, informe: InformeInterface, map: any) {
    const mapBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(planta.latitud - 0.02, planta.longitud - 0.02),
      new google.maps.LatLng(planta.latitud + 0.02, planta.longitud + 0.02)
    );
    const mapMinZoom = planta.zoom - 2;
    const mapMaxZoom = 24;

    map.mapTypeId = 'satellite';
    map.setOptions({ maxZoom: mapMaxZoom });
    map.setOptions({ minZoom: mapMinZoom });

    const urlServer = this.geoserverService.getGeoserverUrl(informe, 'visual');

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
        if (!mapBounds.intersects(tileBounds) || zoom < mapMinZoom || zoom > mapMaxZoom) {
          return null;
        }
        const url = urlServer.replace('{z}', zoom).replace('{x}', coord.x).replace('{y}', coord.y);
        return url;
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

  private getZoomPlanta(planta: PlantaInterface): number {
    let zoom = 17;
    if (planta.potencia >= 10) {
      zoom = zoom - 1;
    }
    return zoom;
  }

  resetService() {
    this.planta = undefined;
    this.plantaDoc = undefined;
    this.plantasCollection = undefined;
    this.locAreaList = undefined;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }
}
