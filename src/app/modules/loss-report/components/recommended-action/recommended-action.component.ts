import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-recommended-action',
  templateUrl: './recommended-action.component.html',
  styleUrls: ['./recommended-action.component.css'],
})
export class RecommendedActionComponent implements OnInit {
  @Input() title: string;
  @Input() cantidad: number;
  @Input() perdidas: number;
  @Input() porcentajeBarra: string;

  constructor() {}

  ngOnInit(): void {}
}
