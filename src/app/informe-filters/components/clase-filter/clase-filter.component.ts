import { Component, OnInit } from '@angular/core';

import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { ClasePcFilter } from '@core/models/clasePcFilter';

interface ClasePc {
  label: string;
  completed: boolean;
  tiposPcs?: ClasePc[];
}

@Component({
  selector: 'app-clase-filter',
  templateUrl: './clase-filter.component.html',
  styleUrls: ['./clase-filter.component.css'],
})
export class ClaseFilterComponent implements OnInit {
  tiposTask: ClasePc;
  tiposPcs: ClasePc[] = [];
  allComplete: boolean;
  filtroTipo: ClasePcFilter;

  constructor(private pcService: PcService, private filterService: FilterService) {}

  ngOnInit(): void {}
}
