import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { map, switchMap, take, takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';

import { UserService } from '@data/services/user.service';
import { PlantaService } from '@data/services/planta.service';

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

  constructor(private plantaService: PlantaService, private userService: UserService) {}

  ngOnInit(): void {
    this.plantaService
      .getAllPlantas()
      .pipe(
        take(1),
        switchMap((plantas) => {
          const plantasObservables = plantas.map((planta) =>
            combineLatest([this.userService.getUser(planta.empresa).pipe(take(1))]).pipe(
              map(([user]) => {
                let empresa = planta.empresa;
                if (user !== null) {
                  empresa = user.empresaNombre;
                }

                return {
                  nombre: planta.nombre,
                  id: planta.id,
                  tipo: planta.tipo,
                  empresa,
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
