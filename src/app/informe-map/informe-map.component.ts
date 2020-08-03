import { Component, OnInit, ViewChild } from '@angular/core';
import { PcService } from '../services/pc.service';
import { PcInterface } from '../models/pc';
import { AgmMap } from '@agm/core';
import { UserAreaInterface } from '../models/userArea';
import { PlantaInterface } from '../models/planta';
import { InformeInterface } from '../models/informe';
import { AngularFireStorage } from '@angular/fire/storage';
import { MatDialog } from '@angular/material/dialog';
import { PlantaService } from '../services/planta.service';
import { InformeService } from '../services/informe.service';
import { GLOBAL } from '../services/global';
import { PcDetailsDialogComponent } from '../informe-view/pc-details-dialog/pc-details-dialog.component';
declare const google: any;

export interface DialogData {
  pc: PcInterface;
  planta: PlantaInterface;
  informe: InformeInterface;
  sinPcs: boolean;
}
@Component({
  selector: 'app-informe-map',
  templateUrl: './informe-map.component.html',
  styleUrls: ['./informe-map.component.css'],
})
export class InformeMapComponent implements OnInit {
  @ViewChild('agm-map') map: AgmMap;

  public circleRadius: number;
  public mapType = 'satellite';
  public userAreaList: UserAreaInterface[];
  public planta: PlantaInterface;
  public informe: InformeInterface;
  public mapLoaded = false;

  constructor(
    private storage: AngularFireStorage,
    public dialog: MatDialog,
    public pcService: PcService,
    private plantaService: PlantaService,
    private informeService: InformeService
  ) {}

  ngOnInit() {
    this.planta = this.plantaService.get();
    this.informe = this.informeService.get();
    this.circleRadius = 5;
    if (this.planta.tipo === 'fija') {
      this.circleRadius = 2;
    } else if (this.planta.tipo === '1 eje') {
      this.circleRadius = 2;
    }

    // this.pcService
    //   .getSeguidoresSinPcs(this.informe.id)
    //   .subscribe(seguidores => {
    //     this.seguidoresSinPcs = seguidores;
    //   });

    this.plantaService.getUserAreas$(this.planta.id).subscribe((userAreas) => {
      this.userAreaList = userAreas;
    });
  }

  initMap(map) {
    if (this.planta.hasOwnProperty('ortofoto')) {
      const ortofoto = this.planta.ortofoto;
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
          return `${ortofoto.url}/${zoom}/${coord.x}/${coord.y}.png`;
        },
        tileSize: new google.maps.Size(256, 256),
        name: 'Tiles',
      });

      map.overlayMapTypes.push(imageMapType);
      map.fitBounds(mapBounds);
    }
  }

  getStrokeColor(severidad: number) {
    return GLOBAL.colores_severidad[severidad - 1];
  }

  onMapCircleClick(selectedPc: PcInterface, sinPcs: boolean = false): void {
    // selectedPc.downloadUrlRjpg$ = this.storage.ref(`informes/${this.informe.id}/rjpg/${selectedPc.archivoPublico}`).getDownloadURL();
    if (!selectedPc.downloadUrl$) {
      selectedPc.downloadUrl$ = this.storage
        .ref(`informes/${this.informe.id}/jpg/${selectedPc.archivoPublico}`)
        .getDownloadURL();
    }
    if (!selectedPc.downloadUrlVisual$ && (!this.informe.hasOwnProperty('jpgVisual') || this.informe.jpgVisual)) {
      selectedPc.downloadUrlVisual$ = this.storage
        .ref(`informes/${this.informe.id}/jpgVisual/${selectedPc.archivoPublico}`)
        .getDownloadURL();
    }
    const dialogRef = this.dialog.open(PcDetailsDialogComponent, {
      width: '1100px',
      // height: '600px',
      hasBackdrop: true,
      data: {
        pc: selectedPc,
        planta: this.planta,
        informe: this.informe,
        sinPcs,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {});
  }

  mapIsReady(map) {
    this.mapLoaded = true;
    this.initMap(map);
  }
}
