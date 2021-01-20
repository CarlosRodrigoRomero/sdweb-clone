import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '../models/pc';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AreaFilter } from '@core/models/areaFilter';
import { GradientFilter } from '@core/models/gradientFilter';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public filters: FilterInterface[] = [];
  public filters$ = new Subject<FilterInterface[]>();
  public filteredPcs: PcInterface[] = [];
  public filteredPcs$ = new BehaviorSubject<PcInterface[]>(this.filteredPcs);

  constructor(private pcService: PcService) {}

  addFilter(filter: FilterInterface) {
    // comprobamos el tipo del filtro que llega
    if (filter instanceof GradientFilter) {
      /* // si existe un filtro de su tipo lo sustituimos ...
      const c = this.filters.filter((f) => f instanceof GradientFilter).length;
      if (c > 0) {
        this.filters.map((f) => {
          if (f instanceof GradientFilter) {
            f = filter;
          }
        });
      } else {
        // ... si no, se añade el filtro a la lista de filtros
        this.filters.push(filter);
      } */
      // eliminamos anteriores filtros Gradient
      this.filters.filter((f) => !(f instanceof GradientFilter));
      this.filters.push(filter);
    } else {
      // si no es del tipo Gradient se añade al array
      this.filters.push(filter);
    }

    this.filters$.next(this.filters);

    this.applyFilters();

    /* const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);

    // Si es el primer filtro sustituimos todos los filtros por los nuevos...
    if (this.filters.length === 1) {
      this.filteredPcs = newFilteredPcs;
    } else {
      // ...si no es el primero, añadimos los nuevos
      // revisamos tambien si ya se están mostrando esos pcs para no repetirlos
      this.filteredPcs = this.filteredPcs.concat(newFilteredPcs.filter((newPc) => !this.filteredPcs.includes(newPc)));
    }
    this.filteredPcs$.next(this.filteredPcs); */
  }

  applyFilters() {
    this.filters.forEach((filter) => {
      if (filter instanceof AreaFilter) {
        const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);
        // Si es el primer filtro sustituimos todos los filtros por los nuevos...
        if (this.filters.length === 1) {
          this.filteredPcs = newFilteredPcs;
        } else {
          // ...si no es el primero, añadimos los nuevos
          // revisamos tambien si ya se están mostrando esos pcs para no repetirlos
          this.filteredPcs = this.filteredPcs.concat(
            newFilteredPcs.filter((newPc) => !this.filteredPcs.includes(newPc))
          );
        }
      }
    });
    this.filters.forEach((filter) => {
      if (filter instanceof GradientFilter) {
        this.filteredPcs = filter.applyFilter(this.filteredPcs);
      }
    });
    this.filteredPcs$.next(this.filteredPcs);
  }

  deleteFilter(filter: FilterInterface) {
    // Elimina el filtro y lo desactiva
    this.filters.splice(this.filters.indexOf(filter), 1);
    this.filters$.next(this.filters);

    // Si era el último filtro mostramos todas las pcs...
    if (this.filters.length === 0) {
      this.filteredPcs = this.pcService.allPcs;
    } else {
      // ... si no era el último, eliminamos solo el filtro
      let newFilteredPcs = filter.unapplyFilter(this.filteredPcs);

      // comprobamos que no se eliminen pcs que pertenezcan a otros filtros
      this.filters.forEach((f) => {
        const coincidentPcs = f.applyFilter(this.filteredPcs).filter((pc) => !newFilteredPcs.includes(pc));
        newFilteredPcs = newFilteredPcs.concat(coincidentPcs);
      });

      this.filteredPcs = newFilteredPcs;
    }
    this.filteredPcs$.next(this.filteredPcs);
  }

  deleteAllFilters() {
    // Elimina todos los filtros
    this.filters = [];
    this.filters$.next(this.filters);

    // Vuelve a mostrar todos los pcs
    this.filteredPcs = this.pcService.allPcs;
    this.filteredPcs$.next(this.filteredPcs);
  }

  getAllFilters(): Observable<FilterInterface[]> {
    return this.filters$.asObservable();
  }

  /*   getAllPcs(): Observable<PcInterface[]> {
    return this.pcService.allPcs$;
  } */
}
