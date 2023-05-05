import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { map, switchMap, take, takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';

import { PlantaService } from '@data/services/planta.service';
import { EmpresaService } from '@data/services/empresa.service';

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html',
  styleUrls: ['./plants.component.css'],
})
export class PlantsComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['nombre', 'id', 'tipo', 'empresa', 'empresaId', 'potencia', 'actions'];
  dataSource = new MatTableDataSource<any>();
  private destroy$ = new Subject<void>();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('search') search: ElementRef;

  constructor(private plantaService: PlantaService, private empresaService: EmpresaService) {}

  ngOnInit(): void {
    this.plantaService
      .getAllPlantas()
      .pipe(
        take(1),
        switchMap((plantas) => {
          const plantasObservables = plantas.map((planta) =>
            combineLatest([this.empresaService.getEmpresa(planta.empresa).pipe(take(1))]).pipe(
              map(([empresa]) => {
                let empresaNombre = planta.empresa;
                if (empresa !== undefined && empresa !== null) {
                  empresaNombre = empresa.nombre;
                }

                return {
                  nombre: planta.nombre,
                  id: planta.id,
                  tipo: planta.tipo,
                  empresa: empresaNombre,
                  empresaId: planta.empresa,
                  potencia: planta.potencia,
                };
              })
            )
          );

          return combineLatest(plantasObservables);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((dataPlantas) => {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
