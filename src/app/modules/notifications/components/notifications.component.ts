import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { Notification } from '@core/models/notification';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  @Input() hasNotifications: boolean;
  @Input() notifications: Notification[];
  @Output() applyFilter = new EventEmitter<number>();

  constructor() {}

  ngOnInit(): void {}
}
