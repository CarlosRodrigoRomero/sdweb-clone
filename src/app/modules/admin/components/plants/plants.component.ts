import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { PlantaService } from '@data/services/planta.service';

import { PlantaInterface } from '@core/models/planta';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html',
  styleUrls: ['./plants.component.css'],
})
export class PlantsComponent implements OnInit {
  private plantas: PlantaInterface[];
  displayedColumns: string[] = ['nombre', 'tipo', 'empresa', 'potencia', 'actions'];
  dataSource = new MatTableDataSource<PlantaInterface>();

  @ViewChild(MatSort) sort: MatSort;

  constructor(private plantaService: PlantaService) {}

  ngOnInit(): void {
    this.plantaService
      .getAllPlantas()
      .pipe(take(1))
      .subscribe((plantas) => (this.dataSource.data = plantas));
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
