import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AuthService } from '@core/services/auth.service';
import { PlantaService } from '@core/services/planta.service';

interface PlantsData {
  nombre: string;
  potencia: number;
  mae: number;
  ultimaInspeccion: number;
  plantaId: string;
}

@Component({
  selector: 'app-plant-list',
  templateUrl: './plant-list.component.html',
  styleUrls: ['./plant-list.component.css'],
})
export class PlantListComponent implements OnInit, AfterViewInit {
  public displayedColumns: string[] = ['nombre', 'potencia', 'mae', 'ultima-inspeccion', 'compartir'];
  public dataSource = new MatTableDataSource<PlantsData>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public auth: AuthService, private plantaService: PlantaService) {}

  ngOnInit(): void {
    const plantsData = [];
    this.auth.user$.subscribe((user) =>
      this.plantaService.getPlantasDeEmpresa(user).subscribe((plantas) => {
        plantas.forEach((planta) => {
          if (planta.informes !== undefined && planta.informes.length > 0) {
            const mae = planta.informes.reduce((prev, current) => (prev.fecha > current.fecha ? prev : current)).mae;
            if (mae !== undefined) {
              plantsData.push({
                nombre: planta.nombre,
                potencia: planta.potencia,
                mae,
                ultimaInspeccion: planta.informes.reduce((prev, current) =>
                  prev.fecha > current.fecha ? prev : current
                ).fecha,
                plantaId: planta.id,
              });
            }
          }
        });
        this.dataSource.data = plantsData;
      })
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  clickEvent() {
    console.log('clickado');
  }
}
