import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Notification } from '@layout/containers/navbar-container/navbar-container.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
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
