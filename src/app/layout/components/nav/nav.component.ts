import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { ThemeService } from '@data/services/theme.service';

import { COLOR } from '@data/constants/color';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent implements OnInit {
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay()
  );

  id: string;
  isPortfolio = false;
  isShared = false;
  showPrediction = false;
  itemSelected = 'list';
  itemColor = COLOR.light_orange;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (this.router.url.split('/').includes('plants')) {
          this.isPortfolio = true;
          this.itemSelected = 'list';
        } else {
          this.isPortfolio = false;
        }

        if (this.router.url.includes('shared')) {
          this.isShared = true;
        } else {
          this.isShared = false;
        }

        if (this.router.url.split('/').includes('map')) {
          this.itemSelected = 'map';
        } else if (this.router.url.split('/').includes('prediction')) {
          this.itemSelected = 'prediction';
        }

        // SOLO PARA CLIENTE INTERNACIONAL
        if (this.router.url.split('/').includes('IJjoEdwZm4qgfhZblS2i')) {
          this.showPrediction = true;
        } else {
          this.showPrediction = false;
        }
      }
    });
  }

  ngOnInit() {
    this.themeService.themeSelected$.subscribe((theme) => {
      if (theme === 'dark-theme') {
        this.itemColor = COLOR.dark_orange;
      } else {
        this.itemColor = COLOR.light_orange;
      }
    });
  }

  navigateTo(page: string) {
    const url = this.router.url.split('/');
    url[url.length - 1] = page;
    this.router.navigate(url);

    // seleccionamos la página para aplicar el estilo
    this.itemSelected = page;
  }
}
