import { Component, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

import { ThemeService } from '@data/services/theme.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css'],
})
export class LoadingComponent implements OnDestroy {
  isDarkTheme = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private themeService: ThemeService) {
    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        if (theme === 'dark-theme') {
          this.isDarkTheme = true;
        } else {
          this.isDarkTheme = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
