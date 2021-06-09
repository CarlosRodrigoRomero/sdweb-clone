import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { MatSelect } from '@angular/material/select';

import { ReplaySubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-mat-selected-search',
  templateUrl: './mat-selected-search.component.html',
  styleUrls: ['./mat-selected-search.component.css'],
})
export class MatSelectedSearchComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() elems: any[];
  @Input() data: string;
  @Input() title: string;
  // public elems: any[] = [];
  public elemsFiltered$: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  // control for the selected element
  public elementCtrl: FormControl = new FormControl('', Validators.required);
  // control for the MatSelect filter keyword
  public elementFilterCtrl: FormControl = new FormControl();
  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  @ViewChild('elemSelect', { static: true }) elemSelect: MatSelect;

  constructor() {}

  ngOnInit(): void {
    this.elementCtrl.setValue(this.elems);

    // cargamos la lista inicial de plantas
    this.elemsFiltered$.next(this.elems.slice());

    // escuchamos cuando se active el input de busqueda
    this.elementFilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.filterElems();
    });
  }

  ngAfterViewInit() {
    this.setInitialValue();
  }

  protected setInitialValue() {
    this.elemsFiltered$.pipe(take(1), takeUntil(this._onDestroy)).subscribe(() => {
      // setting the compareWith property to a comparison function
      // triggers initializing the selection according to the initial value of
      // the form control (i.e. _initializeSelection())
      // this needs to be done after the filteredBanks are loaded initially
      // and after the mat-option elements are available
      this.elemSelect.compareWith = (a: any, b: any) => a && b && a.id === b.id;
    });
  }

  protected filterElems() {
    if (!this.elems) {
      return;
    }
    // get the search keyword
    let search = this.elementFilterCtrl.value;
    if (!search) {
      this.elemsFiltered$.next(this.elems.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the elems
    this.elemsFiltered$.next(this.elems.filter((elem) => elem[this.data].toLowerCase().indexOf(search) > -1));
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
