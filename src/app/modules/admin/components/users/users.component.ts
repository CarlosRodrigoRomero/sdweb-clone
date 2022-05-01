import { Component, AfterViewInit, ViewChild, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AdminService } from '@data/services/admin.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
  users: UserInterface[];
  displayedColumns: string[] = ['email', 'empresa', 'id', 'actions'];
  dataSource = new MatTableDataSource<any>();
  private subscriptions: Subscription = new Subscription();

  @ViewChild(MatSort) sort: MatSort;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.adminService.getAllUsers().subscribe((users) => (this.users = users)));

    const usersTable: any[] = [];
    this.subscriptions.add(
      this.adminService.getAllUsers().subscribe((users) => {
        users.filter((user) => {
          usersTable.push({ email: user.email, empresa: user.empresaNombre, id: user.uid });
        });
        this.dataSource.data = usersTable;
      })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
