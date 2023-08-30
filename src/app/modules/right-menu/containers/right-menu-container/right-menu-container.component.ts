import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { AuthService } from '@data/services/auth.service';

@Component({
  selector: 'app-right-menu-container',
  templateUrl: './right-menu-container.component.html',
  styleUrls: ['./right-menu-container.component.css'],
})
export class RightMenuContainerComponent implements OnInit {
  isShared = false;
  isAdmin = false;
  urls = {
    grafana: 'https://monitor.solardrone.app/',
    newBug: 'https://form.asana.com/?k=KN18mefLSYBjN4OStVyFjg&d=1204869738731689',
    help: 'https://solardrone.notion.site/Ayuda-tutoriales-y-documentaci-n-9b5c508747994fe88f4cbe12a1f6f3b0?pvs=4',
  };

  private subscriptions: Subscription = new Subscription();

  constructor(private router: Router, public authService: AuthService) {}

  ngOnInit(): void {
    if (this.router.url.includes('shared')) {
      this.isShared = true;
    } else {
      this.subscriptions.add(
        this.authService.user$.subscribe((user) => (this.isAdmin = this.authService.userIsAdmin(user)))
      );
    }
  }

  navigateTo(url: string) {
    window.open(url, '_blank');
  }

  signOut() {
    this.authService.signOut();
  }
}
