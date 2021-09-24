import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, BehaviorSubject } from 'rxjs';

import { ShareReportService } from '@core/services/share-report.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { FilterableElement } from '@core/models/filterableInterface';
import { FilterInterface } from '@core/models/filter';
import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private multipleFilters = ['area', 'tipo', 'clase', 'modulo', 'zona', 'criticidad'];
  private noAmosSegsFilters = ['area', 'segsNoAnoms'];
  private otherFilters = ['confianza', 'aspectRatio', 'areaM'];
  public filters: FilterInterface[] = [];
  public filters$ = new BehaviorSubject<FilterInterface[]>(this.filters);
  private _filteredElements: FilterableElement[] = [];
  public filteredElements$ = new BehaviorSubject<FilterableElement[]>(this.filteredElements);
  private _allFiltrableElements: FilterableElement[] = [];
  public allFiltrableElements$ = new BehaviorSubject<FilterableElement[]>(this._allFiltrableElements);
  private _filteredElementsWithoutFilterTipo: FilterableElement[] = [];
  public filteredElementsWithoutFilterTipo$ = new BehaviorSubject<FilterableElement[]>(
    this._filteredElementsWithoutFilterTipo
  );
  public plantaSeguidores = false;

  constructor(
    private router: Router,
    private shareReportService: ShareReportService,
    private filterControlService: FilterControlService
  ) {}

  initService(elems: FilterableElement[], shared?: boolean, sharedId?: string): Promise<boolean> {
    this.allFiltrableElements = elems;
    this.filteredElements = elems;

    return new Promise((response, reject) => {
      if (shared) {
        this.shareReportService.getParams().subscribe((params) => this.filterControlService.setInitParams(params));

        // obtenemos lo filtros guardados en al DB y los añadimos
        this.shareReportService.getFiltersByParams(sharedId).subscribe((filters) => {
          if (filters.length > 0) {
            this.addFilters(filters);

            response(true);
          }
        });
        response(true);
      } else {
        response(true);
      }

      // para contabilizar los diferentes filtros 'tipo'
      this.filteredElementsWithoutFilterTipo = elems;
    });
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

    if (!this.otherFilters.includes(filter.type)) {
      // añadimos parametros para compartir
      this.shareReportService.setParams(filter);
    }

    this.processFilters();
  }

  addFilters(filters: FilterInterface[]) {
    this.filters = filters;
    this.filters$.next(this.filters);

    this.processFilters();
  }

  processFilters() {
    // revisamos tipo de planta
    this.getTipoPlanta();

    // comprobamos primero si hay filtros activos
    if (this.filters.length === 0) {
      // desaplicamos filtros si los hubiese
      this.unapplyFilters();
    } else {
      if (this.plantaSeguidores) {
        const elemsFiltered = this.allFiltrableElements.filter((elem) => {
          const newAnomaliasCliente = this.applyFilters((elem as Seguidor).anomalias) as Anomalia[];
          if (newAnomaliasCliente !== undefined) {
            (elem as Seguidor).anomaliasCliente = newAnomaliasCliente;
          }

          return (elem as Seguidor).anomaliasCliente.length > 0;
        });

        // aplicamos los filtros noAnomsSegs
        this.applyNoAnomsSegsFilters(elemsFiltered);
      } else {
        this.filteredElements = this.applyFilters(this.allFiltrableElements);
      }
    }
  }

  private applyFilters(elements: FilterableElement[]): FilterableElement[] {
    const everyFilterFiltrableElements: Array<FilterableElement[]> = new Array<FilterableElement[]>();

    let multFilters = this.multipleFilters;
    let noMultFilters = this.filters
      .map((filter) => filter.type)
      .filter((filter) => !this.multipleFilters.includes(filter));
    if (this.plantaSeguidores) {
      multFilters = multFilters.filter((filter) => !this.noAmosSegsFilters.includes(filter));
      noMultFilters = noMultFilters.filter((filter) => !this.noAmosSegsFilters.includes(filter));
    }

    // comprobamos si hay filtros de tipo 'multiple'
    if (this.filters.filter((fil) => multFilters.includes(fil.type)).length > 0) {
      // separamos los elems por tipo de filtro
      multFilters.forEach((type) => {
        const newFiltrableElements: FilterableElement[] = [];
        if (this.filters.filter((fil) => fil.type === type).length > 0) {
          // obtenemos un array de las elems filtrados por cada filtro de  diferente tipo
          this.filters
            .filter((fil) => fil.type === type)
            .forEach((fil) => fil.applyFilter(elements).forEach((elem) => newFiltrableElements.push(elem)));
          // añadimos un array de cada tipo
          everyFilterFiltrableElements.push(newFiltrableElements);
        }
      });
    }

    // añadimos al array los elementos filtrados de los filtros no 'multiple'
    this.filters
      .filter((fil) => noMultFilters.includes(fil.type))
      .forEach((fil) => {
        const newFiltrableElements = fil.applyFilter(elements);
        everyFilterFiltrableElements.push(newFiltrableElements);
      });

    // calculamos la interseccion de los array de los diferentes tipos
    let finalElements: FilterableElement[];
    if (everyFilterFiltrableElements.length > 0) {
      finalElements = everyFilterFiltrableElements.reduce((anterior, actual) =>
        anterior.filter((elem) => actual.includes(elem))
      );
    }

    // para calcular el numero de anomalias por filtro tipo
    // this.excludeTipoFilters();

    return finalElements;
  }

  private applyNoAnomsSegsFilters(elems: FilterableElement[]) {
    // comprobamos si hay filtros noAnomsSegs
    if (this.filters.filter((fil) => this.noAmosSegsFilters.includes(fil.type)).length > 0) {
      const everyFilterFiltrableElements = [elems];

      // separamos los elems por tipo de filtro
      this.noAmosSegsFilters.forEach((type) => {
        const newFiltrableElements: FilterableElement[] = [];
        if (this.filters.filter((fil) => fil.type === type).length > 0) {
          // obtenemos un array de las elems filtrados por cada filtro de  diferente tipo
          this.filters
            .filter((fil) => fil.type === type)
            .forEach((fil) => fil.applyFilter(elems).forEach((elem) => newFiltrableElements.push(elem)));
          // añadimos un array de cada tipo
          everyFilterFiltrableElements.push(newFiltrableElements);
        }
      });

      // calculamos la interseccion de los array de los diferentes tipos
      if (everyFilterFiltrableElements.length > 0) {
        this.filteredElements = everyFilterFiltrableElements.reduce((anterior, actual) =>
          anterior.filter((elem) => actual.includes(elem))
        );
      }
    } else {
      this.filteredElements = elems;
    }
  }

  private unapplyFilters() {
    if (this.plantaSeguidores) {
      this.filteredElements = this.allFiltrableElements.filter((elem) => {
        (elem as Seguidor).anomaliasCliente = (elem as Seguidor).anomalias.filter(
          // tslint:disable-next-line: triple-equals
          (anom) => anom.tipo != 0 && anom.criticidad !== null
        );

        return (elem as Seguidor).anomaliasCliente.length > 0;
      });
    } else {
      this.filteredElements = this.allFiltrableElements;
    }
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

    if (!this.otherFilters.includes(filter.type)) {
      // reseteamos parametros para compartir
      this.shareReportService.resetParams(filter);
    }

    this.processFilters();
  }

  deleteAllFilters() {
    // Elimina todos los filtros
    this.filters = [];
    this.filters$.next(this.filters);

    // reseteamos todos los parametros para compartir
    this.shareReportService.resetAllParams();

    this.processFilters();
  }

  private excludeTipoFilters() {
    const everyFilterFiltrableElements: Array<FilterableElement[]> = new Array<FilterableElement[]>();

    // comprobamos si hay filtros de tipo 'multiple'
    if (this.filters.filter((filter) => this.multipleFilters.includes(filter.type)).length > 0) {
      // separamos los elems por tipo de filtro excluyendo los filtros "tipo"
      this.multipleFilters
        .filter((type) => type !== 'tipo')
        .forEach((type) => {
          const newFiltrableElements: FilterableElement[] = [];
          if (this.filters.filter((filter) => filter.type === type).length > 0) {
            this.filters
              .filter((filter) => filter.type === type)
              .forEach((filter) => {
                filter.applyFilter(this.allFiltrableElements).forEach((pc) => newFiltrableElements.push(pc));
              });
            // añadimos un array de cada tipo
            everyFilterFiltrableElements.push(newFiltrableElements);
          }
        });
    }

    // añadimos al array los elems filtrados de los filtros no 'multiple'
    this.filters
      .filter((filter) => !this.multipleFilters.includes(filter.type))
      .forEach((filter) => {
        const newFiltrableElements = filter.applyFilter(this.allFiltrableElements);
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
      this.filteredElementsWithoutFilterTipo = this.allFiltrableElements;
    }

    this.filteredElementsWithoutFilterTipo$.next(this.filteredElementsWithoutFilterTipo);
  }

  addElement(element: FilterableElement) {
    this.allFiltrableElements.push(element);

    this.processFilters();
  }

  private getTipoPlanta() {
    if (this.router.url.includes('tracker')) {
      this.plantaSeguidores = true;
    }
  }

  /////////////////////////////////////////////////

  get allFiltrableElements() {
    return this._allFiltrableElements;
  }

  set allFiltrableElements(value: FilterableElement[]) {
    this._allFiltrableElements = value;
    this.allFiltrableElements$.next(value);
  }

  get filteredElements() {
    return this._filteredElements;
  }

  set filteredElements(value: FilterableElement[]) {
    this._filteredElements = value;
    this.filteredElements$.next(value);
  }

  get filteredElementsWithoutFilterTipo() {
    return this._filteredElementsWithoutFilterTipo;
  }

  set filteredElementsWithoutFilterTipo(value: FilterableElement[]) {
    this._filteredElementsWithoutFilterTipo = value;
    this.filteredElementsWithoutFilterTipo$.next(value);
  }
}
