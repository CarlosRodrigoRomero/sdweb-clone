import { Component, OnInit, ViewChild } from '@angular/core';

import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-views',
  templateUrl: './views.component.html',
  styleUrls: ['./views.component.css'],
})
export class ViewsComponent implements OnInit {
  @ViewChild('stepper') private stepper: MatStepper;

  constructor() {}

  ngOnInit(): void {}

  changeView(view: number) {
    this.stepper.selectedIndex = view;
  }
}
