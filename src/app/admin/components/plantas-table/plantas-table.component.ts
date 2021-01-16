import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';

import { PlantaService } from '@core/services/planta.service';

import { PlantaInterface } from '@core/models/planta';
import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-plantas-table',
  templateUrl: './plantas-table.component.html',
  styleUrls: ['./plantas-table.component.css'],
})
export class PlantasTableComponent implements OnInit, AfterViewInit {
  plantas: PlantaInterface[];
  displayedColumns: string[] = ['select', 'name', 'power', 'type', 'id'];
  dataSource = new MatTableDataSource<any>();

  selection = new SelectionModel<any[]>(true, []);
  plantasUser: string[] = [];

  @Input() user: UserInterface;
  @Output() newPlantasUser = new EventEmitter<string[]>();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private plantaService: PlantaService) {}

  ngOnInit(): void {
    // Guarda todas las plantas en un array local
    this.plantaService.getAllPlantas().subscribe((plantas) => (this.plantas = plantas));
    console.log(this.user);

    // Filtra en un array los datos a mostrar en la tabla
    const plantasTable: any[] = [];
    this.plantaService.getAllPlantas().subscribe((plantas) => {
      plantas.filter((planta) => {
        plantasTable.push({
          name: planta.nombre,
          power: planta.potencia,
          type: planta.tipo,
          id: planta.id,
        });
      });
      this.dataSource.data = plantasTable;

      // Marca como seleccionadas las plantas del usuario
      this.dataSource.data.forEach((row) => {
        this.user.plantas.forEach((planta) => {
          if (row['id'] === planta) {
            this.selection.select(row);
            this.plantasUser.push(row['id']);
          }
        });
      });
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Si el número de elementos seleccionados coincide con el número total de filas
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  // Selecciona y deselecciona todos los checkbox
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  plantasUsuario() {
    this.plantasUser = [];
    this.dataSource.data.forEach((row) => {
      if (this.selection.isSelected(row)) {
        this.plantasUser.push(row['id']);
      }
    });
    console.log(this.plantasUser);
    this.newPlantasUser.emit(this.plantasUser);
  }
}
