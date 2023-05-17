import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-total-loss',
  templateUrl: './total-loss.component.html',
  styleUrls: ['./total-loss.component.css'],
})
export class TotalLossComponent {
  @Input() totalMae: number;
  @Input() fixableMae: number;
  @Input() numTotalAnoms: number;
  @Input() numFixableAnoms: number;

  constructor() {}
}
