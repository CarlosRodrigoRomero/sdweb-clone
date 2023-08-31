import { Component, OnDestroy, OnInit } from '@angular/core';

import { NavigationEnd, Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { AuthService } from '@data/services/auth.service';
import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';
import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { DemoService } from '@data/services/demo.service';
import { PortfolioControlService } from '@data/services/portfolio-control.service';

import { UserInterface } from '@core/models/user';
import { TipoElemFilter } from '@core/models/tipoPcFilter';
import { GradientFilter } from '@core/models/gradientFilter';
import { Notification } from '@core/models/notification';

@Component({
  selector: 'app-navbar-container',
  templateUrl: './navbar-container.component.html',
  styleUrls: ['./navbar-container.component.css'],
})
export class NavbarContainerComponent implements OnInit, OnDestroy {
  isShared = false;
  userLogged: boolean;
  private user: UserInterface;
  isAdmin: boolean;
  loadContent = false;
  loadPortfolioContent = false;
  hasNotifications = false;
  notifications: Notification[] = [];
  isReport = false;
  isDemo = false;
  tipoComentarios = false;
  isPortfolio = false;

  private subscriptions: Subscription = new Subscription();

  themeSelected = 'light-theme';

  constructor(
    public authService: AuthService,
    private router: Router,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private demoService: DemoService,
    private comentariosControlService: ComentariosControlService,
    private portfolioControlService: PortfolioControlService
  ) {}

  ngOnInit() {
    // si el enlace es compartido no requerimos estar loggeado
    if (this.router.url.includes('shared')) {
      this.isShared = true;
    } else {
      this.subscriptions.add(this.authService.isAuthenticated().subscribe((isAuth) => (this.userLogged = isAuth)));
      this.subscriptions.add(
        this.authService.user$.subscribe((user) => {
          this.user = user;
          this.isAdmin = this.authService.userIsAdmin(user);
        })
      );
      if (
        this.router.url.includes('fixed') ||
        this.router.url.includes('tracker') ||
        this.router.url.includes('rooftop')
      ) {
        this.isReport = true;
      }

      if (this.router.url.split('/').includes('plants')) {
        this.isPortfolio = true;
      }
    }

    this.subscriptions.add(
      this.reportControlService.reportDataLoaded$.subscribe((loaded) => {
        this.loadContent = loaded;
      })
    );

    this.subscriptions.add(
      this.portfolioControlService.initialized$.subscribe((value) => {
        this.loadPortfolioContent = value;
      })
    );

    // controlamos acciones al navegar
    this.navigationChanges();

    // comprobamos si es la planta demo
    this.isDemo = this.demoService.checkIsDemo();

    this.subscriptions.add(
      this.comentariosControlService.dataLoaded$.subscribe((value) => (this.tipoComentarios = value))
    );
  }

  private navigationChanges() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (this.router.url.split('/').includes('plants')) {
          this.isPortfolio = true;

          this.subscriptions.add(
            this.reportControlService.reportDataLoaded$.subscribe((loaded) => {
              this.loadContent = loaded;
            })
          );
        } else {
          this.isPortfolio = false;

          this.subscriptions.add(
            this.portfolioControlService.initialized$.subscribe((value) => {
              this.loadPortfolioContent = value;
            })
          );
        }

        // si el enlace es compartido no requerimos estar loggeado
        if (this.router.url.includes('shared')) {
          this.isShared = true;
        } else {
          this.isShared = false;

          this.subscriptions.add(this.authService.isAuthenticated().subscribe((isAuth) => (this.userLogged = isAuth)));
          this.subscriptions.add(
            this.authService.user$.subscribe((user) => {
              this.user = user;
              this.isAdmin = this.authService.userIsAdmin(user);
            })
          );

          if (
            this.router.url.includes('fixed') ||
            this.router.url.includes('tracker') ||
            this.router.url.includes('rooftop')
          ) {
            this.isReport = true;
          } else {
            this.isReport = false;

            // reseteamos la carga de contenido
            this.reportControlService.reportDataLoaded = false;
          }
        }
      }
    });
  }

  navigateHome() {
    if (this.user.role === 0 || this.user.role === 1 || this.user.role === 2 || this.user.role === 6) {
      this.router.navigate(['/clients']);
    }
  }

  applyFilter(filter: string) {
    if (filter === 'CA (string)') {
      const tipoFilterCA = new TipoElemFilter('', 'tipo', 17, 0, 0);

      this.filterService.addFilters([tipoFilterCA]);
    }
    if (filter === 'suciedad') {
      const tipoFilterSuciedad = new TipoElemFilter('', 'tipo', 11, 0, 0);

      this.filterService.addFilters([tipoFilterSuciedad]);
    }
    if (filter === 'cc gradiente 40') {
      const tipoFilterCC = new TipoElemFilter('', 'tipo', 8, 0, 0);
      const tipoFilterVarCC = new TipoElemFilter('', 'tipo', 9, 0, 0);
      const gradientFilter = new GradientFilter('gradient', 40, 80);

      this.filterService.addFilters([tipoFilterCC, tipoFilterVarCC, gradientFilter]);
    }
  }

  signOut() {
    this.authService.signOut();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
