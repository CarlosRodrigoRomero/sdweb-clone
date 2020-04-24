import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { PcInterface } from 'src/app/models/pc';
import { EstructuraInterface } from 'src/app/models/estructura';
import { InformeService } from '../../services/informe.service';
import { MatTableDataSource } from '@angular/material';
import { MatSort, MatPaginator } from '@angular/material';
import { ArchivoVueloInterface } from '../../models/archivoVuelo';

@Component({
  selector: 'app-edit-list',
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditListComponent implements OnInit {
  @Input() allEstructuras: EstructuraInterface[];
  @Input() informeId: string;
  @Input() pcsOrEstructuras: boolean;

  @ViewChild(MatSort, { read: true }) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  selectedElementoPlanta: PcInterface | EstructuraInterface;
  displayedColumnsEst: string[];
  currentArchivoVuelo: ArchivoVueloInterface;
  dataSourceEst = new MatTableDataSource(this.allEstructuras);

  constructor(private informeService: InformeService) {
    this.displayedColumnsEst = ['vuelo', 'globalCoords', 'archivo'];
  }

  ngOnInit() {
    this.dataSourceEst.sort = this.sort;
    this.dataSourceEst.paginator = this.paginator;

    this.informeService.getAllEstructuras(this.informeId).subscribe((estArray) => {
      this.dataSourceEst.data = estArray;
    });

    this.informeService.selectedArchivoVuelo$.subscribe((archivoVuelo) => {
      if (this.currentArchivoVuelo !== archivoVuelo) {
        this.setArchivoVuelo(archivoVuelo);
      }
    });

    this.informeService.selectedElementoPlanta$.subscribe((elementoPlanta) => {
      if (this.selectedElementoPlanta !== elementoPlanta) {
        this.setElementoPlanta(elementoPlanta);
      }
    });
  }

  setArchivoVuelo(archivoVuelo: ArchivoVueloInterface): void {
    this.currentArchivoVuelo = archivoVuelo;
    this.applyFilter(archivoVuelo.vuelo);
  }

  setElementoPlanta(elementoPlanta: PcInterface | EstructuraInterface): void {
    console.log('EditListComponent -> setElementoPlanta -> elementoPlanta', elementoPlanta);
    this.setArchivoVuelo({ archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface);
    this.selectedElementoPlanta = elementoPlanta;
  }

  onClickRowEstList(elementoPlanta: PcInterface | EstructuraInterface): void {
    // Comunicar al componente principal que el elemento seleccionado cambia
    this.setElementoPlanta(elementoPlanta);
    this.informeService.selectElementoPlanta(elementoPlanta);
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.dataSourceEst.filter = filterValue;
  }
}
