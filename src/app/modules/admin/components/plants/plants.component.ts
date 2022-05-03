import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { take } from 'rxjs/operators';

import { PlantaService } from '@data/services/planta.service';

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html',
  styleUrls: ['./plants.component.css'],
})
export class PlantsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nombre', 'id', 'tipo', 'empresa', 'potencia', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('search') search: ElementRef;

  constructor(private plantaService: PlantaService) {}

  ngOnInit(): void {
    this.plantaService
      .getAllPlantas()
      .pipe(take(1))
      .subscribe((plantas) => {
        const dataPlantas: any[] = [];
        plantas.forEach((planta) => {
          const dataPlanta = {
            nombre: planta.nombre,
            id: planta.id,
            tipo: planta.tipo,
            empresa: planta.empresa,
            potencia: planta.potencia,
          };

          dataPlantas.push(dataPlanta);
        });

        this.dataSource.data = dataPlantas;
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.search.nativeElement.focus();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
