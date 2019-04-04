import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { PcInterface } from '../../models/pc';
import { MatTableDataSource, MatSort, MatPaginator} from '@angular/material';
import { PcService } from '../../services/pc.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { InformeInterface } from '../../models/informe';
import { PlantaInterface } from '../../models/planta';
import { GLOBAL } from 'src/app/services/global';


@Component({
  selector: 'app-pc-list',
  templateUrl: './pc-list.component.html',
  styleUrls: ['./pc-list.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('* <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class PcListComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() informe: InformeInterface;
  @Input() planta: PlantaInterface;

  public expandedElement: PcInterface;
  public allPcs: PcInterface[];
  public columnsToDisplay: string[];
  public informeId: string;
  public pcDataSource: MatTableDataSource<PcInterface>;
  public searchKey: string;
  public profileUrl: Observable<string | null>;
  public pcDescripcion: string[];
  public pcPerdidas: string[];



  constructor(
    private pcService: PcService,
    private route: ActivatedRoute
  ) {
    this.columnsToDisplay = ['severidad', 'tipo', 'perdidas', 'local_id', 'global_x', 'temperaturaMax', 'gradienteNormalizado'];
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.pcPerdidas = GLOBAL.pcPerdidas;
  }

  ngOnInit() {
    this.pcService.currentFilteredPcs$.subscribe(
      list => {
        this.pcDataSource = new MatTableDataSource(list);
        this.pcDataSource.sort = this.sort;
        this.pcDataSource.paginator = this.paginator;
        // this.pcDataSource.filterPredicate = (data, filter) => {
        //   return ['local_id'].some(ele => {
        //     return data[ele].toLowerCase().indexOf(filter) !== -1;
        //   });
        // };
      }
    );
  }

  onClickToggleDetail(element) {
    if (this.expandedElement === element) {
      this.expandedElement = null;
    } else { this.expandedElement = element; }
  }

  onSearchClear() {
    this.searchKey = '';
    this.applyFilter();
  }

  applyFilter() {
    this.pcDataSource.filter = this.searchKey.trim().toLowerCase();
  }

  getPercent(pc: PcInterface) {
    let result = pc.temperaturaMax - pc.temperaturaMedia;
    result /= (this.planta.temp_limite - pc.temperaturaMedia);
    result *= 100;
    result = Math.abs(result);

    return result.toString();
  }

}
