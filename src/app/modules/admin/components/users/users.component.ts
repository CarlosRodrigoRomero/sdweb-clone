import { Component, AfterViewInit, ViewChild, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';

import { UserService } from '@data/services/user.service';

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

  private subscriptions = new Subscription();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('search') search: ElementRef;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.userService.getAllUsers().subscribe((users) => {
        this.users = users;

        const usersTable: any[] = [];
        users.filter((user) => {
          usersTable.push({ email: user.email, empresa: user.empresaNombre, id: user.uid });
        });
        this.dataSource.data = usersTable;
      })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.search.nativeElement.focus();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
