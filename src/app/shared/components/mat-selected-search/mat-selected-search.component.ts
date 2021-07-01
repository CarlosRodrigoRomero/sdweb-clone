import { AfterViewInit, Component, Input, OnDestroy, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
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
  @Input() elements: any[];
  @Input() elementSelected: any;
  @Input() property: string;
  @Input() title: string;

  public elemsFiltered$: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  // control for the selected element
  public elementCtrl: FormControl = new FormControl('', Validators.required);
  // control for the MatSelect filter keyword
  public elementFilterCtrl: FormControl = new FormControl();
  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  @ViewChild('elemSelect', { static: true }) elemSelect: MatSelect;

  @Output() elemSelected = new EventEmitter();

  constructor() {}

  ngOnInit(): void {
    this.elementCtrl.setValue(this.elements);

    // cargamos la lista inicial de plantas
    this.elemsFiltered$.next(this.elements.slice());

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
      this.elemSelect.compareWith = (a: any, b: any) => a && b && a[this.property] === b[this.property];
    });
  }

  protected filterElems() {
    if (!this.elements) {
      return;
    }
    // get the search keyword
    let search = this.elementFilterCtrl.value;
    if (!search) {
      this.elemsFiltered$.next(this.elements.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the elems
    this.elemsFiltered$.next(this.elements.filter((elem) => elem[this.property].toLowerCase().indexOf(search) > -1));
  }

  sendOutput() {
    this.elemSelected.emit(this.elementSelected);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
