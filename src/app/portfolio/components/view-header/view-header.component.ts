import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-view-header',
  templateUrl: './view-header.component.html',
  styleUrls: ['./view-header.component.css'],
})
export class ViewHeaderComponent {
  @Output() viewSelected = new EventEmitter();

  constructor() {}

  sendViewSelected(index: number) {
    this.viewSelected.emit(index);
  }
}
