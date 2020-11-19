import { Component, OnInit } from '@angular/core';

import { FilterService } from '@core/services/filter.service';

import { UserAreaInterface } from '@core/models/userArea';
import { Observable } from 'rxjs';
import { FilterInterface } from '@core/models/filter';

@Component({
  selector: 'app-active-filter-list',
  templateUrl: './active-filter-list.component.html',
  styleUrls: ['./active-filter-list.component.css'],
})
export class ActiveFilterListComponent implements OnInit {
  removable = true;
  public area: UserAreaInterface;
  public filter: FilterInterface[];
  public filter$: Observable<FilterInterface[]>;
  public areasUserId: string[];

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    this.filter$ = this.filterService.getAllFilters();
  }

  deleteFilter(filter: FilterInterface) {
    this.filterService.deleteFilter(filter);
  }
}
