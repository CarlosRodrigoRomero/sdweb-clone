import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { ReportControlService } from '@core/services/report-control.service';
import { ThemeService } from '@core/services/theme.service';
import { FilterService } from '@core/services/filter.service';

import { UserInterface } from '@core/models/user';
import { TipoElemFilter } from '@core/models/tipoPcFilter';
import { GradientFilter } from '@core/models/gradientFilter';

interface Notification {
  content: string;
  filter: string;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isShared = false;
  userLogged: boolean;
  private user: UserInterface;
  isAdmin: boolean;
  loadSummary = false;
  hasNotifications = false;
  notifications: Notification[] = [];
  isPortfolio = false;

  private subscriptions: Subscription = new Subscription();

  themeSelected = 'light-theme';

  constructor(
    public authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private reportControlService: ReportControlService,
    private filterService: FilterService
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
      if (this.router.url.includes('plants')) {
        this.isPortfolio = true;
      }
    }

    this.subscriptions.add(
      this.reportControlService.mapLoaded$.subscribe((value) => {
        this.loadSummary = value;

        if (value) {
          setTimeout(() => (document.getElementById('plant-summary').style.visibility = 'unset'), 1000);
        }
      })
    );

    this.subscriptions.add(
      this.reportControlService.plantaId$.subscribe((plantaId) => {
        if (plantaId !== undefined) {
          if (plantaId === '3JXI01XmcE3G1d4WNMMd' || plantaId === 'buzSMRcLEEeLfhnqfbbG') {
            this.hasNotifications = true;
            if (plantaId === '3JXI01XmcE3G1d4WNMMd') {
              this.notifications.push({
                content: 'Hay 20 módulos en circuito abierto (string)',
                filter: 'CA (string)',
              });
              this.notifications.push({
                content: 'Hay varias anomalías térmicas como consecuencia de suciedad en los módulos',
                filter: 'suciedad',
              });
            }
            if (plantaId === 'buzSMRcLEEeLfhnqfbbG') {
              this.notifications = [
                {
                  content: 'Hay 2 células calientes con un gradiente mayor de 40 ºC (Grave)',
                  filter: 'cc gradiente 40',
                },
              ];
            }
          }
        }
      })
    );

    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        if (user.uid === 'xsx8U7BrLRU20pj9Oa35ZbJIggx2') {
          this.hasNotifications = true;
          // vaciamos las notificaciones
          this.notifications = [];
          // diferenciamos entre el portfolio y el informe
          if (this.router.url.includes('egF0cbpXnnBnjcrusoeR')) {
            this.notifications.push({
              content: 'Hay 17 módulos en circuito abierto (string)',
              filter: 'CA (string)',
            });
          } else {
            this.notifications.push({
              content: 'Hay nuevos strings abiertos en la planta Demo',
              filter: 'CA (string)',
            });
            this.notifications.push({
              content: 'Planta 3 tiene 6 módulos con células calientes con gradiente mayor de 40 ºC',
              filter: '',
            });
            this.notifications.push({
              content: 'Planta 1 tienen un problema con strings abiertos',
              filter: '',
            });
          }
        }
      })
    );

    // this.themeService.themeSelected$.subscribe((theme) => (this.themeSelected = theme));
  }

  navigateHome() {
    if (this.user.role === 0 || this.user.role === 1 || this.user.role === 2) {
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
