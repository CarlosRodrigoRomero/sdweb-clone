import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { UserInterface } from '@core/models/user';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AdminService } from '@core/services/admin.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements AfterViewInit {
  users: UserInterface[];
  displayedColumns: string[] = ['email', 'empresa', 'id', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatSort) sort: MatSort;

  constructor(private adminService: AdminService) {
    //
    this.adminService.getAllUsers().subscribe((users) => (this.users = users));
    const usersTable: any[] = [];
    this.adminService.getAllUsers().subscribe((users) => {
      users.filter((user) => {
        usersTable.push({ email: user.email, empresa: user.empresaNombre, id: user.uid });
      });
      this.dataSource.data = usersTable;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }
}
