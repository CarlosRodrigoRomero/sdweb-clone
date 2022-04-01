import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-view-header',
  templateUrl: './view-header.component.html',
  styleUrls: ['./view-header.component.css'],
})
export class ViewHeaderComponent implements OnInit {
  private _currentView = 0;
  currentView$ = new BehaviorSubject<number>(this._currentView);
  viewsTitles = [
    'Lo más relevante en el portolio',
    'Listado de plantas',
    'MAE y Variación de MAE',
    'Pérdidas y Variación de pérdidas',
    'Predicción evolución MAE en el tiempo',
  ];

  @Output() viewSelected = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  sendViewSelected(index: number) {
    this.currentView = index;
    this.viewSelected.emit(index);
  }

  get currentView() {
    return this._currentView;
  }

  set currentView(value: number) {
    this._currentView = value;
    this.currentView$.next(value);
  }
}
