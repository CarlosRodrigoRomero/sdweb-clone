import { Component, Input, OnInit } from '@angular/core';

import { Anomalia } from '@core/models/anomalia';

@Component({
  selector: 'app-anomalia-info-editable',
  templateUrl: './anomalia-info-editable.component.html',
  styleUrls: ['./anomalia-info-editable.component.css'],
})
export class AnomaliaInfoEditableComponent implements OnInit {
  @Input() anomaliaSelected: Anomalia;
  @Input() mobile: boolean;

  constructor() {}

  ngOnInit(): void {}
}
