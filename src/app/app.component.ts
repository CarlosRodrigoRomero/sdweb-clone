import { Component, HostBinding, OnInit } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { NavigationEnd, Router } from '@angular/router';

import { ThemeService } from '@core/services/theme.service';
import { filter } from 'rxjs/operators';

declare var gtag;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Solardrone';

  @HostBinding('class') componentCssClass: any;

  constructor(public overlayContainer: OverlayContainer, private themeService: ThemeService, private router: Router) {
    const navEndEvents$ = this.router.events.pipe(filter((event) => event instanceof NavigationEnd));

    navEndEvents$.subscribe((event: NavigationEnd) => {
      gtag('config', 'G-76T306HFCN', {
        page_path: event.urlAfterRedirects,
      });
    });
  }

  ngOnInit() {
    this.themeService.themeSelected$.subscribe((theme) => {
      this.overlayContainer.getContainerElement().classList.add(theme);
      this.componentCssClass = theme;
    });
  }
}
