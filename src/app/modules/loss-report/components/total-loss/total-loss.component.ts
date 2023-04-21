import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-total-loss',
  templateUrl: './total-loss.component.html',
  styleUrls: ['./total-loss.component.css'],
})
export class TotalLossComponent {
  @Input() totalLoss: number;
  @Input() totalLossPercentage: number;
  @Input() totalFixedLoss: number;
  @Input() totalFixedLossPercentage: number;
  @Input() totalNotFixedLoss: number;
  @Input() totalNotFixedLossPercentage: number;

  constructor() {}
}
