import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-list-create-map',
  templateUrl: './list-create-map.component.html',
  styleUrls: ['./list-create-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListCreateMapComponent implements OnInit {
  @Input() displayedColumns: string;
  @Input() dataSource: MatTableDataSource<any>;

  constructor() {}

  ngOnInit(): void {}
}
