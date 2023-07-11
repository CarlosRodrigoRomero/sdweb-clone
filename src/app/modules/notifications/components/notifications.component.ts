import { Component, Input, OnInit } from '@angular/core';

import { PortfolioControlService } from '@data/services/portfolio-control.service';

import { Notification } from '@core/models/notification';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  @Input() hasNotifications: boolean;
  @Input() notifications: Notification[];

  constructor(private portfolioControlService: PortfolioControlService) {}

  ngOnInit(): void {}

  applyFilter() {
    this.portfolioControlService.filteredPlants = this.portfolioControlService.listaPlantas.filter((planta) =>
      this.notifications[0].plants.map((p) => p.id).includes(planta.id)
    );
  }
}
