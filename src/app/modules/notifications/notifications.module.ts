import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { PortfolioNotificationsComponent } from './containers/portfolio-notifications/portfolio-notifications.component';

import { NotificationsComponent } from './components/notifications.component';

@NgModule({
  declarations: [NotificationsComponent, PortfolioNotificationsComponent],
  imports: [CommonModule, SharedModule],
  exports: [PortfolioNotificationsComponent],
})
export class NotificationsModule {}
