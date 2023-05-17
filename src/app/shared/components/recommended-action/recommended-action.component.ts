import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-recommended-action',
  templateUrl: './recommended-action.component.html',
  styleUrls: ['./recommended-action.component.css'],
})
export class RecommendedActionComponent {
  @Input() title: string;
  @Input() cantidad: number;
  @Input() perdidas: number;
  @Input() porcentajeBarra: string;
  @Input() fixable: boolean;
  @Output() changeState = new EventEmitter<boolean>();

  constructor() {}
}
