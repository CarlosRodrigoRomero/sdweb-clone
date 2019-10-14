import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { PcInterface } from "../../models/pc";
import { MatTableDataSource, MatSort, MatPaginator } from "@angular/material";
import { PcService } from "../../services/pc.service";
import { Observable } from "rxjs";
import {
  animate,
  state,
  style,
  transition,
  trigger
} from "@angular/animations";
import { InformeInterface } from "../../models/informe";
import { PlantaInterface } from "../../models/planta";
import { GLOBAL } from "src/app/services/global";
import { PlantaService } from "../../services/planta.service";

@Component({
  selector: "app-pc-list",
  templateUrl: "./pc-list.component.html",
  styleUrls: ["./pc-list.component.css"],
  animations: [
    trigger("detailExpand", [
      state(
        "collapsed, void",
        style({ height: "0px", minHeight: "0", display: "none" })
      ),
      state("expanded", style({ height: "*" })),
      transition("* <=> *", animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)"))
    ])
  ]
})
export class PcListComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() informe: InformeInterface;
  @Input() planta: PlantaInterface;
  @Input() allPcs: PcInterface[];

  public expandedElement: PcInterface;
  public columnsToDisplay: string[];
  public pcDataSource: MatTableDataSource<PcInterface>;
  public searchKey: string;
  public profileUrl: Observable<string | null>;
  public pcDescripcion: string[];
  public pcPerdidas: number[];
  public temperaturaLimite: number;

  constructor(
    private pcService: PcService,
    public plantaService: PlantaService
  ) {
    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.pcPerdidas = GLOBAL.pcPerdidas;
    this.temperaturaLimite = GLOBAL.temperaturaLimiteFabricantes;
  }

  ngOnInit() {
    this.pcService.currentFilteredPcs$.subscribe(list => {
      this.pcDataSource = new MatTableDataSource(list);
      this.pcDataSource.filterPredicate = (pc, filter) => {
        filter = filter.toLowerCase();
        if (this.planta.tipo === "seguidores") {
          return (
            this.plantaService
              .getNombreSeguidor(pc)
              .toLowerCase()
              .includes(filter) ||
            pc.local_id
              .toString()
              .toLowerCase()
              .includes(filter)
          );
        } else {
          return (
            pc.local_id
              .toString()
              .toLowerCase()
              .includes(filter) ||
            pc.global_x
              .toString()
              .toLowerCase()
              .includes(filter) ||
            pc.global_y
              .toString()
              .toLowerCase()
              .includes(filter)
          );
        }
      };
      this.pcDataSource.sort = this.sort;
      this.pcDataSource.paginator = this.paginator;
      // this.pcDataSource.filterPredicate = (data, filter) => {
      //   return ['local_id'].some(ele => {
      //     return data[ele].toLowerCase().indexOf(filter) !== -1;
      //   });
      // };
    });

    if (this.planta.tipo === "seguidores") {
      this.columnsToDisplay = [
        "severidad",
        "tipo",
        "perdidas",
        "local_id",
        "global_x",
        "temperaturaMax",
        "gradienteNormalizado"
      ];
    } else {
      this.columnsToDisplay = [
        "severidad",
        "tipo",
        "perdidas",
        "local_id",
        "global_x",
        "global_y",
        "temperaturaMax",
        "gradienteNormalizado"
      ];
    }
  }

  onClickToggleDetail(element) {
    if (this.expandedElement === element) {
      this.expandedElement = null;
    } else {
      this.expandedElement = element;
    }
  }

  onSearchClear() {
    this.searchKey = "";
    this.applyFilter();
  }

  applyFilter() {
    this.pcDataSource.filter = this.searchKey.trim().toLowerCase();
  }

  getPercent(pc: PcInterface) {
    let result = pc.gradienteNormalizado;
    result /= this.temperaturaLimite - pc.temperaturaRef;
    result *= 100;
    result = Math.abs(result);

    return result.toString();
  }

  checkIsNaN(item: any) {
    return Number.isNaN(item);
  }

  checkIsMoreThanOne(item: any) {
    if (Number.isNaN(item) || typeof item === "string") {
      return false;
    }
    return item > 1;
  }

  getPerdidas(tipoPc: number) {
    return GLOBAL.pcPerdidas[tipoPc];
  }
}
