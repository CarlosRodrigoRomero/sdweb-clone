import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  Input
} from "@angular/core";
import { PcInterface } from "../../models/pc";
import { PcService } from "../../services/pc.service";
import { PlantaInterface } from "../../models/planta";
import { InformeInterface } from "../../models/informe";
import { AgmMap } from "@agm/core";
import { GLOBAL } from "src/app/services/global";
import { MatDialog } from "@angular/material";
import { AngularFireStorage } from "@angular/fire/storage";
import { UserAreaInterface } from "../../models/userArea";
import { PlantaService } from "../../services/planta.service";
import { PcDetailsDialogComponent } from "src/app/informe-view/pc-details-dialog/pc-details-dialog.component";
import { InformeService } from "../../services/informe.service";

export interface DialogData {
  pc: PcInterface;
  allPcs: PcInterface[];
  planta: PlantaInterface;
  informe: InformeInterface;
  sinPcs: boolean;
}

@Component({
  selector: "app-map",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.css"]
})
export class MapComponent implements OnInit {
  @ViewChild("agm-map") map: AgmMap;

  @Input() filteredPcs: PcInterface[];
  public circleRadius: number;
  public mapType = "satellite";
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
    if (this.planta.tipo === "fija") {
      this.circleRadius = 2;
    } else if (this.planta.tipo === "1 eje") {
      this.circleRadius = 2;
    }

    // this.pcService
    //   .getSeguidoresSinPcs(this.informe.id)
    //   .subscribe(seguidores => {
    //     this.seguidoresSinPcs = seguidores;
    //   });

    this.plantaService.getUserAreas$(this.planta.id).subscribe(userAreas => {
      this.userAreaList = userAreas;
    });
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
    if (
      !selectedPc.downloadUrlVisual$ &&
      (!this.informe.hasOwnProperty("jpgVisual") || this.informe.jpgVisual)
    ) {
      selectedPc.downloadUrlVisual$ = this.storage
        .ref(
          `informes/${this.informe.id}/jpgVisual/${selectedPc.archivoPublico}`
        )
        .getDownloadURL();
    }
    const dialogRef = this.dialog.open(PcDetailsDialogComponent, {
      width: "1100px",
      // height: '600px',
      hasBackdrop: true,
      data: {
        pc: selectedPc,
        allPcs: this.filteredPcs,
        planta: this.planta,
        informe: this.informe,
        sinPcs: sinPcs
      }
    });

    dialogRef.afterClosed().subscribe(result => {});
  }

  mapIsReady(map: AgmMap) {
    this.mapLoaded = true;
  }
}
