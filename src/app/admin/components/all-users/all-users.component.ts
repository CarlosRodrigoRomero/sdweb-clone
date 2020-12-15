import { Component, OnInit } from '@angular/core';
import { UserInterface } from '@core/models/user';

import { AdminService } from '@core/services/admin.service';

@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.css'],
})
export class AllUsersComponent implements OnInit {
  users: UserInterface[];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe((user) => (this.users = user));
  }
}
