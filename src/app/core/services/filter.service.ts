import { Injectable } from '@angular/core';

import { Observable, BehaviorSubject } from 'rxjs';

import { AnomaliaService } from './anomalia.service';
import { ShareReportService } from '@core/services/share-report.service';
import { SeguidorService } from '@core/services/seguidor.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { FiltrableInterface } from '@core/models/filtrableInterface';
import { FilterInterface } from '@core/models/filter';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private multipleFilters = ['area', 'tipo', 'clase', 'modulo', 'zona'];
  private filters: FilterInterface[] = [];
  public filters$ = new BehaviorSubject<FilterInterface[]>(this.filters);
  private filtersByType: FilterInterface[] = [];
  private filtersByType$ = new BehaviorSubject<FilterInterface[]>(this.filtersByType);
  private filteredElements: FiltrableInterface[] = [];
  public filteredElements$ = new BehaviorSubject<FiltrableInterface[]>(this.filteredElements);
  private _allFiltrableElements: FiltrableInterface[];
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  private filteredElementsWithoutFilterTipo: FiltrableInterface[] = [];
  public filteredElementsWithoutFilterTipo$ = new BehaviorSubject<FiltrableInterface[]>(
    this.filteredElementsWithoutFilterTipo
  );

  constructor(
    private anomaliaService: AnomaliaService,
    private shareReportService: ShareReportService,
    private seguidorService: SeguidorService,
    private filterControlService: FilterControlService
  ) {}

  initService(shared: boolean, plantaId: string, plantaFija: boolean, sharedId?: string): Observable<boolean> {
    if (plantaFija) {
      this.anomaliaService.getAnomaliasPlanta$(plantaId).subscribe((array) => {
        this._allFiltrableElements = array;
        this.filteredElements$.next(array);
        if (shared) {
          this.shareReportService.getParams().subscribe((params) => this.filterControlService.setInitParams(params));

          // obtenemos lo filtros guardados en al DB y los añadimos
          this.shareReportService.getFiltersByParams(sharedId).subscribe((filters) => {
            if (filters.length > 0) {
              this.addFilters(filters);
            }
            this.initialized$.next(true);
          });
        } else {
          this.initialized$.next(true);
        }

        // para contabilizar los diferentes filtros 'tipo'
        this.filteredElementsWithoutFilterTipo = array;
        this.filteredElementsWithoutFilterTipo$.next(this.filteredElementsWithoutFilterTipo);
      });
    } else {
      this.seguidorService.getSeguidoresPlanta$(plantaId).subscribe((seguidores) => {
        this._allFiltrableElements = seguidores;
        this.filteredElements$.next(seguidores);

        this.initialized$.next(true);
      });
    }

    return this.initialized$;
  }

  addFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'multiple'
    if (!this.multipleFilters.includes(filter.type)) {
      // eliminamos, si lo hubiera, el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
      // añadimos el nuevo filtro
      this.filters.push(filter);
    } else {
      // si es del tipo 'multiple' se añade al array
      this.filters.push(filter);
    }
    this.filters$.next(this.filters);

    // añadimos parametros para compartir
    this.shareReportService.setParams(filter);

    this.applyFilters();
  }

  addFilters(filters: FilterInterface[]) {
    this.filters = filters;
    this.filters$.next(this.filters);

    this.applyFilters();
  }

  private applyFilters() {
    const everyFilterFiltrableElements: Array<FiltrableInterface[]> = new Array<FiltrableInterface[]>();

    // comprobamos si hay filtros de tipo 'multiple'
    if (this.filters.filter((fil) => this.multipleFilters.includes(fil.type)).length > 0) {
      // separamos los elems por tipo de filtro
      this.multipleFilters.forEach((type) => {
        const newFiltrableElements: FiltrableInterface[] = [];
        if (this.filters.filter((fil) => fil.type === type).length > 0) {
          // obtenemos un array de las elems filtrados por cada filtro de  diferente tipo
          this.filters
            .filter((fil) => fil.type === type)
            .forEach((fil) => {
              fil.applyFilter(this._allFiltrableElements).forEach((elem) => newFiltrableElements.push(elem));
            });
          // añadimos un array de cada tipo
          everyFilterFiltrableElements.push(newFiltrableElements);
        }
      });
    }

    // añadimos al array los elementos filtrados de los filtros no 'multiple'
    this.filters
      .filter((fil) => !this.multipleFilters.includes(fil.type))
      .forEach((fil) => {
        const newFiltrableElements = fil.applyFilter(this._allFiltrableElements);
        everyFilterFiltrableElements.push(newFiltrableElements);
      });

    // calculamos la interseccion de los array de los diferentes tipos
    if (everyFilterFiltrableElements.length > 0) {
      this.filteredElements = everyFilterFiltrableElements.reduce((anterior, actual) =>
        anterior.filter((elem) => actual.includes(elem))
      );
    }

    // comprobamos que hay algun filtro activo
    if (everyFilterFiltrableElements.length === 0) {
      this.filteredElements = this._allFiltrableElements;
    }

    this.filteredElements$.next(this.filteredElements);

    // para calcular el numero de anomalias por filtro tipo
    this.excludeTipoFilters();
  }

  getAllTypeFilters(type: string) {
    this.filtersByType = this.filters.filter((filter) => filter.type === type);
    this.filtersByType$.next(this.filtersByType);
    return this.filtersByType$.asObservable();
  }

  getAllFilters(): Observable<FilterInterface[]> {
    return this.filters$.asObservable();
  }

  deleteFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'multiple'
    if (!this.multipleFilters.includes(filter.type)) {
      // eliminamos el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
    } else {
      this.filters.splice(this.filters.indexOf(filter), 1);
    }
    this.filters$.next(this.filters);

    // reseteamos parametros para compartir
    this.shareReportService.resetParams(filter);

    this.applyFilters();
  }

  deleteAllFilters() {
    // Elimina todos los filtros
    this.filters = [];
    this.filters$.next(this.filters);

    // reseteamos todos los parametros para compartir
    this.shareReportService.resetAllParams();

    this.applyFilters();
  }

  excludeTipoFilters() {
    const everyFilterFiltrableElements: Array<FiltrableInterface[]> = new Array<FiltrableInterface[]>();

    // comprobamos si hay filtros de tipo 'multiple'
    if (this.filters.filter((filter) => this.multipleFilters.includes(filter.type)).length > 0) {
      // separamos los pcs por tipo de filtro
      this.multipleFilters
        .filter((type) => type !== 'tipo')
        .forEach((type) => {
          const newFiltrableElements: FiltrableInterface[] = [];
          if (this.filters.filter((filter) => filter.type === type).length > 0) {
            this.filters
              .filter((filter) => filter.type === type)
              .forEach((filter) => {
                filter.applyFilter(this._allFiltrableElements).forEach((pc) => newFiltrableElements.push(pc));
              });
            // añadimos un array de cada tipo
            everyFilterFiltrableElements.push(newFiltrableElements);
          }
        });
    }

    // añadimos al array los pcs filtrados de los filtros no 'multiple'
    this.filters
      .filter((filter) => !this.multipleFilters.includes(filter.type))
      .forEach((filter) => {
        const newFiltrableElements = filter.applyFilter(this._allFiltrableElements);
        everyFilterFiltrableElements.push(newFiltrableElements);
      });

    // calculamos la interseccion de los array de los diferentes tipos
    if (everyFilterFiltrableElements.length > 0) {
      this.filteredElementsWithoutFilterTipo = everyFilterFiltrableElements.reduce((anterior, actual) =>
        anterior.filter((pc) => actual.includes(pc))
      );
    }

    // comprobamos que hay algun filtro activo
    if (everyFilterFiltrableElements.length === 0) {
      this.filteredElementsWithoutFilterTipo = this._allFiltrableElements;
    }

    this.filteredElementsWithoutFilterTipo$.next(this.filteredElementsWithoutFilterTipo);
  }
}
