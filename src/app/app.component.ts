import { Component, HostBinding, OnInit } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Solardrone';

  @HostBinding('class') componentCssClass: any;

  constructor(public overlayContainer: OverlayContainer, private themeService: ThemeService) {}

  ngOnInit() {
    this.themeService.themeSelected$.subscribe((theme) => {
      this.overlayContainer.getContainerElement().classList.add(theme);
      this.componentCssClass = theme;
    });
  }
}
