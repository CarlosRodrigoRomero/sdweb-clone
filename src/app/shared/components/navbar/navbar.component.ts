import { Component, OnInit } from '@angular/core';
import { NavigationStart, Router, Event } from '@angular/router';

import { switchMap } from 'rxjs/operators';

import { AuthService } from '@core/services/auth.service';
import { InformeService } from '@core/services/informe.service';
import { ReportControlService } from '@core/services/report-control.service';
import { ThemeService } from '@core/services/theme.service';

import { InformeInterface } from '@core/models/informe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  public numPlantas: number;
  public potenciaTotal: number;
  public load = false;
  private subscription: Subscription = new Subscription();

  public isShared = false;
  public userLogged: boolean;
  public isAdmin: boolean;

  public nombrePlanta = 'Planta demo';
  public potenciaPlanta = 1;
  public tipoPlanta = 'fija';
  public informe: InformeInterface = null;

  public themeSelected = 'light-theme';

  constructor(
    public authService: AuthService,
    private router: Router,
    private reportControlService: ReportControlService,
    private informeService: InformeService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // si el enlace es compartido no requerimos estar loggeado
    if (this.router.url.includes('shared')) {
      this.isShared = true;
    } else {
      this.authService.isAuthenticated().subscribe((isAuth) => (this.userLogged = isAuth));
      this.authService.user$.subscribe((user) => {
        this.isAdmin = this.authService.userIsAdmin(user);
      });
    }

    // si cargamos vista informe directamente, nos subscribimos al informe seleccionado
    if (this.router.url.includes('fixed') || this.router.url.includes('tracker')) {
      this.subscription.add(
        this.reportControlService.selectedInformeId$
          .pipe(switchMap((informeId) => this.informeService.getInforme(informeId)))
          .subscribe((informe) => {
            this.informe = informe;
          })
      );
    }

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        if (event.url.includes('fixed') || event.url.includes('tracker')) {
          // si navegamos a vista informe nos suscribimos al informe seleccionado
          this.subscription.add(
            this.reportControlService.selectedInformeId$
              .pipe(switchMap((informeId) => this.informeService.getInforme(informeId)))
              .subscribe((informe) => {
                this.informe = informe;
              })
          );
        } else {
          // sino cancelamos la suscripcion
          this.subscription.unsubscribe();
          this.informe = undefined;
        }
      }
    });

    // this.themeService.themeSelected$.subscribe((theme) => (this.themeSelected = theme));
  }

  signOut() {
    this.authService.signOut();
  }
}
