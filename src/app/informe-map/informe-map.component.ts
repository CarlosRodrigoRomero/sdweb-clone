import { Component, OnInit } from "@angular/core";
import { PcService } from "../services/pc.service";
import { PcInterface } from "../models/pc";

@Component({
  selector: "app-informe-map",
  templateUrl: "./informe-map.component.html",
  styleUrls: ["./informe-map.component.css"]
})
export class InformeMapComponent implements OnInit {
  public filteredPcs: PcInterface[];
  constructor(private pcService: PcService) {}

  ngOnInit() {
    this.pcService.currentFilteredPcs$.subscribe(list => {
      this.filteredPcs = list;
      // this.map.triggerResize();
      // this.pcDataSource.filterPredicate = (data, filter) => {
      //   return ['local_id'].some(ele => {
      //     return data[ele].toLowerCase().indexOf(filter) !== -1;
      //   });
      // };
    });
  }
}
