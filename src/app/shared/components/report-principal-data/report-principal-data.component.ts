import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-report-principal-data',
  templateUrl: './report-principal-data.component.html',
  styleUrls: ['./report-principal-data.component.css'],
})
export class ReportPrincipalDataComponent implements OnInit {
  @Input() mae: number;
  @Input() maeReparable: number;
  @Input() numAnoms: number;
  @Input() numAnomsFiltered: number;

  constructor() {}

  ngOnInit(): void {}
}
