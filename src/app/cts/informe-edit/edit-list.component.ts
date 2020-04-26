import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { EstructuraInterface, Estructura } from 'src/app/models/estructura';
import { InformeService } from '../../services/informe.service';
import { MatTableDataSource } from '@angular/material';
import { MatPaginator } from '@angular/material';
import { ArchivoVueloInterface } from '../../models/archivoVuelo';
import { ActivatedRoute } from '@angular/router';
import { ElementoPlantaInterface } from '../../models/elementoPlanta';
import { map } from 'rxjs/operators';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-edit-list',
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.css'],
})
export class EditListComponent implements OnInit {
  @Input() pcsOrEstructuras: boolean;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  selectedElementoPlanta: ElementoPlantaInterface;
  displayedColumnsEst: string[];
  currentArchivoVuelo: ArchivoVueloInterface;
  allEstructuras: EstructuraInterface[];
  dataSourceEst = new MatTableDataSource(this.allEstructuras);
  informeId: string;
  loadedElementos = false;

  constructor(private route: ActivatedRoute, private informeService: InformeService) {}

  ngOnInit() {
    this.displayedColumnsEst = ['error', 'globalCoords', 'archivo'];
    this.informeId = this.route.snapshot.paramMap.get('id');
    this.dataSourceEst.paginator = this.paginator;

    this.informeService.getAllEstructuras(this.informeId).subscribe((estArray) => {
      estArray.sort(this.dynamicSort('archivo'));
      this.dataSourceEst.data = estArray;
      this.loadedElementos = true;
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
