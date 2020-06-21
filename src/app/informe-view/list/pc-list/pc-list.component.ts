import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Observable } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { GLOBAL } from 'src/app/services/global';
import { InformeInterface } from 'src/app/models/informe';
import { PlantaInterface } from 'src/app/models/planta';
import { PcInterface } from 'src/app/models/pc';
import { PcService } from 'src/app/services/pc.service';
import { PlantaService } from 'src/app/services/planta.service';
import { InformeService } from '../../../services/informe.service';

@Component({
  selector: 'app-pc-list',
  templateUrl: './pc-list.component.html',
  styleUrls: ['./pc-list.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('* <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class PcListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  public allPcs: PcInterface[];

  public pcDataSource: MatTableDataSource<PcInterface> = new MatTableDataSource();
  public expandedElement: PcInterface;
  public columnsToDisplay: string[];
  public searchKey: string;
  public profileUrl: Observable<string | null>;
  public pcDescripcion: string[];
  public pcPerdidas: number[];
  public temperaturaLimite: number;
  public informe: InformeInterface;
  public planta: PlantaInterface;

  constructor(
    public pcService: PcService,
    public plantaService: PlantaService,
    private informeService: InformeService
  ) {
    this.pcDescripcion = GLOBAL.pcDescripcion;
    this.pcPerdidas = GLOBAL.pcPerdidas;
    this.temperaturaLimite = GLOBAL.temperaturaLimiteFabricantes;
  }

  ngOnInit() {
    this.planta = this.plantaService.get();
    this.informe = this.informeService.get();
    this.allPcs = this.pcService.get();
    if (this.planta.tipo === 'seguidores') {
      this.columnsToDisplay = [
        'severidad',
        'tipo',
        'perdidas',
        'local_id',
        'global_x',
        'temperaturaMax',
        'gradienteNormalizado',
      ];
    } else {
      this.columnsToDisplay = [
        'severidad',
        'tipo',
        'perdidas',
        'local_id',
        'global_x',
        'global_y',
        'temperaturaMax',
        'gradienteNormalizado',
      ];
    }

    this.pcDataSource.sort = this.sort;
    this.pcDataSource.paginator = this.paginator;

    /* now it's okay to set large data source... */
    this.pcService.currentFilteredPcs$.subscribe((list) => {
      this.pcDataSource.data = list;
      this.pcDataSource.filterPredicate = (pc, filter) => {
        filter = filter.toLowerCase();
        if (this.planta.tipo === 'seguidores') {
          return (
            this.plantaService.getNombreSeguidor(pc).toLowerCase().includes(filter) ||
            pc.local_id.toString().toLowerCase().includes(filter)
          );
        } else {
          if (pc.hasOwnProperty('globalCoords')) {
            return (
              pc.local_id.toString().toLowerCase().includes(filter) ||
              pc.globalCoords.toString().toLowerCase().includes(filter)
            );
          } else {
            return (
              pc.local_id.toString().toLowerCase().includes(filter) ||
              pc.global_x.toString().toLowerCase().includes(filter) ||
              pc.global_y.toString().toLowerCase().includes(filter)
            );
          }
        }
      };
    });
  }

  ngAfterViewInit() {}

  onClickToggleDetail(element) {
    if (this.expandedElement === element) {
      this.expandedElement = null;
    } else {
      this.expandedElement = element;
    }
  }

  onSearchClear() {
    this.searchKey = '';
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
    if (Number.isNaN(item) || typeof item === 'string') {
      return false;
    }
    return item > 1;
  }

  getPerdidas(tipoPc: number) {
    return GLOBAL.pcPerdidas[tipoPc];
  }
}
