import { Component, OnInit } from '@angular/core';

import { FilterService } from '@core/services/filter.service';

@Component({
  selector: 'app-filter-pcs-list',
  templateUrl: './filter-pcs-list.component.html',
  styleUrls: ['./filter-pcs-list.component.css'],
})
export class FilterPcsListComponent implements OnInit {
  constructor(public filterService: FilterService) {}

  ngOnInit(): void {}
}
