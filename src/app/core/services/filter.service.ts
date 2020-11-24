import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '../models/pc';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { LatLngLiteral } from '@agm/core';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filters: FilterInterface[] = [];
  public filters$ = new Subject<FilterInterface[]>();
  public filteredPcs: PcInterface[] = [];
  public filteredPcs$ = new BehaviorSubject<PcInterface[]>(this.filteredPcs);
  public areaFilters: FilterInterface[] = [];

  constructor(private pcService: PcService) {
    this.filteredPcs$.next(this.pcService.allPcs);
    this.filteredPcs = this.pcService.allPcs;
  }

  addFilter(filter: FilterInterface) {
    // Añade el filtro y lo aplica
    this.filters.push(filter);
    this.filters$.next(this.filters);

    const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);

    // Si es el primer filtro sustituimos todos los filtros por los nuevos...
    if (this.filters.length === 1) {
      this.filteredPcs = newFilteredPcs;
    } else {
      // ...si no es el primero, añadimos los nuevos
      // revisamos tambien si ya se están mostrando esos pcs para no repetirlos
      this.filteredPcs = this.filteredPcs.concat(newFilteredPcs.filter((newPc) => !this.filteredPcs.includes(newPc)));
    }
    this.filteredPcs$.next(this.filteredPcs);
  }

  getAllFilters() {
    return this.filters$.asObservable();
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
      const newFilteredPcs = filter.unapplyFilter(this.filteredPcs);
      this.filteredPcs = newFilteredPcs;
      
      /* this.filters.forEach(filter => {
        filter.applyFilter(this.filteredPcs).filter(pc => !newFilteredPcs.includes(pc), newFilteredPcs.push(pc));
      }); */
    }
    this.filteredPcs$.next(this.filteredPcs);
  }

  /*  deleteFilter(filter: FilterInterface) {
    const index = this.filters.indexOf(filter);

    if (index >= 0) {
      this.filters[index].area.polygon.setMap(null);
      this.filters.splice(index, 1);
    }

    this.deletePcsByArea(filter.area.path);
  } */

  // filterPcsByArea(path: LatLngLiteral[]) {
  //   this.getAllPcs()
  //     .pipe(map((pcs) => pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, path))))
  //     .subscribe((pcs) => pcs.map((pc) => this.filteredPcs.push(pc)));

  //   this.filteredPcs$.next(this.filteredPcs);
  //   /* this.getAllPcs()
  //     .pipe(map((pcs) => pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, path))))
  //     .subscribe((pcs) => pcs.map((pc) => this.filters.map((f) => f.area.pcs.push(pc))));

  //   this.allPcsByAreaFiltered(); */
  // }

  // /* allPcsByAreaFiltered() {
  //   const areaFilter: FilterInterface[] = this.filters.filter((f) => (f.type = 'area'));
  //   for (let i = 0; i <= areaFilter.length; i++) {
  //     for (let j = 0; j <= areaFilter[i].area.pcs.length; j++) {
  //       this.pcsAreas.push(areaFilter[i].area.pcs[j]);
  //     }
  //   }
  //   this.pcsAreas$.next(this.pcsAreas);
  // } */

  /* deletePcsByArea(path: LatLngLiteral[]) {
    this.getAllPcs()
      .pipe(map((pcs) => pcs.filter((pc) => this.isContained({ lat: pc.gps_lat, lng: pc.gps_lng }, path))))
      .subscribe((pcs) => pcs.map((pc) => this.filteredPcs.splice(this.filteredPcs.indexOf(pc), 1)));
    this.filteredPcs$.next(this.filteredPcs);
  }
 */
  getAllPcs(): Observable<PcInterface[]> {
    return this.pcService.allPcs$;
  }
}
