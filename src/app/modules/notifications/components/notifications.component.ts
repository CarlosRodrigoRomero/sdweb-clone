import { Component, Input, OnInit } from '@angular/core';

import { Notification } from '@core/models/notification';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  @Input() hasNotifications: boolean;
  @Input() notifications: Notification[];

  constructor() {}

  ngOnInit(): void {}
}
