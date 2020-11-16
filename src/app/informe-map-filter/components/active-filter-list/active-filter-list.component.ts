import { Component, OnInit } from '@angular/core';

import { FilterService } from '../../../services/filter.service';

import { UserAreaInterface } from '../../../models/userArea';

@Component({
  selector: 'app-active-filter-list',
  templateUrl: './active-filter-list.component.html',
  styleUrls: ['./active-filter-list.component.css'],
})
export class ActiveFilterListComponent implements OnInit {
  removable = true;
  public area: UserAreaInterface;
  public areas: UserAreaInterface[];
  public areasUserId: string[];

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    this.areas = this.filterService.getAllAreas();
  }

  deleteArea(area: UserAreaInterface) {
    this.filterService.deleteArea(area);
    this.filterService.updateAreas();
  }
}
