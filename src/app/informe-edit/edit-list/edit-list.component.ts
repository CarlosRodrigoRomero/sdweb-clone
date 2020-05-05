import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { InformeService } from '../../services/informe.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ArchivoVueloInterface } from '../../models/archivoVuelo';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { PcService } from '../../services/pc.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-edit-list',
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.css'],
})
export class EditListComponent implements OnInit {
  @Input() set pcsOrEstructuras(value: boolean) {
    this.pcsOrEstructuras2 = value;
    this.onChangePcsOrEstructuras(value);
  }

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private displayedColumnsEst: string[];
  private displayedColumnsPc: string[];
  displayedColumns: string[];
  dataSource = new MatTableDataSource<ElementoPlantaInterface>();
  informeId: string;
  pcsOrEstructuras2: boolean;

  constructor(private route: ActivatedRoute, public informeService: InformeService, public pcService: PcService) {}

  ngOnInit() {
    this.displayedColumnsEst = ['error', 'globalCoords', 'archivo'];
    this.displayedColumnsPc = ['error', 'localId', 'tipo', 'globalCoords', 'localCoords', 'modulo', 'archivo'];
    this.displayedColumns = this.displayedColumnsEst;
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: ElementoPlantaInterface, filter: string) => {
      return !this.pcsOrEstructuras2;
    };

    const allEstructuras$ = this.informeService.getAllEstructuras(this.informeId).pipe(
      map((estArray) => {
        return estArray.sort(this.dynamicSort('archivo'));
      })
    );
    const allPcs$ = this.pcService.getPcsInformeEdit(this.informeId);

    combineLatest([allEstructuras$, allPcs$]).subscribe((elem) => {
      let data = new Array<ElementoPlantaInterface>();
      data = data.concat([...elem[0], ...elem[1]]);
      console.log('EditListComponent -> ngOnInit -> data', data);
      this.dataSource.data = data;
    });

    this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
      this.setArchivoVuelo(archivoVuelo);
    });

    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      if (elementoPlanta !== null) {
        this.setElementoPlanta(elementoPlanta);
      }
    });
  }

  setArchivoVuelo(archivoVuelo: ArchivoVueloInterface): void {
    this.applyFilter(archivoVuelo.vuelo);
  }

  setElementoPlanta(elementoPlanta: ElementoPlantaInterface): void {
    this.setArchivoVuelo({ archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface);
  }

  onClickRowList(elementoPlanta: ElementoPlantaInterface): void {
    // Comunicar al componente principal que el elemento seleccionado cambia
    this.setElementoPlanta(elementoPlanta);
    this.informeService.selectElementoPlanta(elementoPlanta);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  onChangePcsOrEstructuras(val: boolean) {
    console.log('EditListComponent -> onChangePcsOrEstructuras -> val', val);
    this.displayedColumns = val ? this.displayedColumnsPc : this.displayedColumnsEst;
    this.dataSource.filter = '';
  }

  private dynamicSort(property) {
    let sortOrder = -1;

    if (property[0] === '-') {
      sortOrder = -1;
      property = property.substr(1);
    }

    return (a, b) => {
      if (sortOrder === -1) {
        return b[property].localeCompare(a[property]);
      } else {
        return a[property].localeCompare(b[property]);
      }
    };
  }
}
