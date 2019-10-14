import {
  Component,
  OnInit,
  ViewChild,
  Input,
  AfterViewChecked
} from "@angular/core";
import { PcInterface } from "../../models/pc";
import { PcService } from "../../services/pc.service";
import { PlantaInterface } from "../../models/planta";
import { ActivatedRoute } from "@angular/router";
import { InformeInterface } from "../../models/informe";
import { AgmMap } from "@agm/core";
import { GLOBAL } from "src/app/services/global";
import { MatDialog } from "@angular/material";
import { PcDetailsDialogComponent } from "../pc-details-dialog/pc-details-dialog.component";
import { AngularFireStorage } from "@angular/fire/storage";

export interface DialogData {
  pc: PcInterface;
  allPcs: PcInterface[];
  planta: PlantaInterface;
  informe: InformeInterface;
  sinPcs: boolean;
}

@Component({
  selector: "app-pc-map",
  templateUrl: "./pc-map.component.html",
  styleUrls: ["./pc-map.component.css"]
})
export class PcMapComponent implements OnInit {
  @Input() planta: PlantaInterface;
  @Input() informe: InformeInterface;
  @ViewChild("agm-map") map: AgmMap;

  public filteredPcs: PcInterface[];
  public informeId: string;
  public circleRadius: number;
  public mapType = "satellite";
  public seguidoresSinPcs: PcInterface[];

  constructor(
    private storage: AngularFireStorage,
    public dialog: MatDialog,
    private pcService: PcService,
    private route: ActivatedRoute
  ) {
    this.informeId = this.route.snapshot.paramMap.get("id");
  }

  ngOnInit() {
    this.circleRadius = 5;
    if (this.planta.tipo === "fija") {
      this.circleRadius = 2;
    }
    this.pcService.currentFilteredPcs$.subscribe(list => {
      this.filteredPcs = list;
      // this.map.triggerResize();
      // this.pcDataSource.filterPredicate = (data, filter) => {
      //   return ['local_id'].some(ele => {
      //     return data[ele].toLowerCase().indexOf(filter) !== -1;
      //   });
      // };
    });

    this.pcService
      .getSeguidoresSinPcs(this.informe.id)
      .subscribe(seguidores => {
        this.seguidoresSinPcs = seguidores;
      });
  }

  getStrokeColor(severidad: number) {
    return GLOBAL.colores_severidad[severidad - 1];
  }

  onMapCircleClick(selectedPc: PcInterface, sinPcs: boolean = false): void {
    // selectedPc.downloadUrlRjpg$ = this.storage.ref(`informes/${this.informeId}/rjpg/${selectedPc.archivoPublico}`).getDownloadURL();
    if (!selectedPc.downloadUrl$) {
      selectedPc.downloadUrl$ = this.storage
        .ref(`informes/${this.informeId}/jpg/${selectedPc.archivoPublico}`)
        .getDownloadURL();
    }
    if (
      !selectedPc.downloadUrlVisual$ &&
      (!this.informe.hasOwnProperty("jpgVisual") || this.informe.jpgVisual)
    ) {
      selectedPc.downloadUrlVisual$ = this.storage
        .ref(
          `informes/${this.informeId}/jpgVisual/${selectedPc.archivoPublico}`
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

  mapIsReady(map: AgmMap) {}
}
