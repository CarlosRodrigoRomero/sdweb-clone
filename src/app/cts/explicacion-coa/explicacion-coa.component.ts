import { Component, OnInit, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { PcDetailsDialogComponent } from "../pc-details-dialog/pc-details-dialog.component";
import { GLOBAL } from "src/app/services/global";
import { CriteriosClasificacion } from "../../models/criteriosClasificacion";

@Component({
  selector: "app-explicacion-coa",
  templateUrl: "./explicacion-coa.component.html",
  styleUrls: ["./explicacion-coa.component.css"]
})
export class ExplicacionCoaComponent implements OnInit {
  public global = GLOBAL;
  public criterio: CriteriosClasificacion;
  public categoriasPorGradiente: number[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<PcDetailsDialogComponent>
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {}

  ngAfterViewInit() {}
  ngOnInit() {
    this.criterio = this.data.criterio as CriteriosClasificacion;

    this.categoriasPorGradiente = Array(GLOBAL.labels_tipos.length)
      .fill(0)
      .map((_, i) => i)
      .filter(cat => {
        return (
          !this.criterio.critCoA.siempreCoA3.includes(cat) &&
          !this.criterio.critCoA.siempreCoA2.includes(cat) &&
          !this.global.labels_bloqueadas.includes(cat) &&
          !this.criterio.critCoA.siempreVisible.includes(cat)
        );
      });
  }
}
