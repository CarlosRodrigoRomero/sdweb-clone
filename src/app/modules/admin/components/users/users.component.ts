import { Component, AfterViewInit, ViewChild, OnInit, ElementRef } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { UserService } from '@data/services/user.service';

import { UserInterface } from '@core/models/user';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit, AfterViewInit {
  users: UserInterface[];
  displayedColumns: string[] = ['email', 'empresa', 'id', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('search') search: ElementRef;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const usersTable: any[] = [];
    this.userService
      .getAllUsers()
      .pipe(take(1))
      .subscribe((users) => {
        this.users = users;

        users.filter((user) => {
          usersTable.push({ email: user.email, empresa: user.empresaNombre, id: user.uid });
        });
        this.dataSource.data = usersTable;
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.search.nativeElement.focus();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
