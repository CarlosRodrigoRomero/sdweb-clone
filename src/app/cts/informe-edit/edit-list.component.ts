import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { PcInterface } from 'src/app/models/pc';
import { EstructuraInterface } from 'src/app/models/estructura';
import { InformeService } from '../../services/informe.service';
import { MatTableDataSource } from '@angular/material';
import { MatSort, MatPaginator } from '@angular/material';
import { ArchivoVueloInterface } from '../../models/archivoVuelo';
import { ActivatedRoute } from '@angular/router';
import { Estructura } from '../../models/estructura';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';

@Component({
  selector: 'app-edit-list',
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.css'],
})
export class EditListComponent implements OnInit {
  @Input() pcsOrEstructuras: boolean;

  @ViewChild(MatSort, { read: true }) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  selectedElementoPlanta: ElementoPlantaInterface;
  displayedColumnsEst: string[];
  currentArchivoVuelo: ArchivoVueloInterface;
  allEstructuras: EstructuraInterface[];
  dataSourceEst = new MatTableDataSource(this.allEstructuras);
  informeId: string;

  constructor(private route: ActivatedRoute, private informeService: InformeService) {
    this.displayedColumnsEst = ['vuelo', 'globalCoords', 'archivo'];
    this.informeId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit() {
    this.dataSourceEst.sort = this.sort;
    this.dataSourceEst.paginator = this.paginator;

    this.informeService.getAllEstructuras(this.informeId).subscribe((estArray) => {
      estArray.sort(this.dynamicSort('archivo'));
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

  dynamicSort(property) {
    let sortOrder = 1;

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

  setArchivoVuelo(archivoVuelo: ArchivoVueloInterface): void {
    this.currentArchivoVuelo = archivoVuelo;
    this.applyFilter(archivoVuelo.vuelo);
  }

  setElementoPlanta(elementoPlanta: ElementoPlantaInterface): void {
    this.setArchivoVuelo({ archivo: elementoPlanta.archivo, vuelo: elementoPlanta.vuelo } as ArchivoVueloInterface);
    this.selectedElementoPlanta = elementoPlanta;
  }

  onClickRowEstList(elementoPlanta: ElementoPlantaInterface): void {
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
