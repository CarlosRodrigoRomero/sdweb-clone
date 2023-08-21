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

  navigateNewBug() {
    const urlNewBugForm = 'https://form.asana.com/?k=KN18mefLSYBjN4OStVyFjg&d=1204869738731689';

    window.open(urlNewBugForm, '_blank');
  }

  signOut() {
    this.authService.signOut();
  }
}
