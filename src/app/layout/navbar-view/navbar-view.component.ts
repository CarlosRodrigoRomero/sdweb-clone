import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Notification } from '@layout/navbar/navbar.component';

@Component({
  selector: 'app-navbar-view',
  templateUrl: './navbar-view.component.html',
  styleUrls: ['./navbar-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarViewComponent {
  @Input() loadContent: boolean;
  @Input() tipoComentarios: boolean;
  @Input() isAdmin: boolean;
  @Input() isReport: boolean;
  @Input() isDemo: boolean;
  @Input() isShared: boolean;
  @Input() hasNotifications: boolean;
  @Input() notifications: Notification[];
  @Output() navigateHome = new EventEmitter();
  @Output() signOut = new EventEmitter();
  @Output() applyFilter = new EventEmitter<string>();
}
