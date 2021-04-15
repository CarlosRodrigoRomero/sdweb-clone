import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { switchMap } from 'rxjs/operators';

import { AuthService } from '@core/services/auth.service';
import { InformeService } from '@core/services/informe.service';
import { ReportControlService } from '@core/services/report-control.service';
import { ThemeService } from '@core/services/theme.service';

import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  public numPlantas: number;
  public potenciaTotal: number;
  public load = false;

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

    this.reportControlService.selectedInformeId$
      .pipe(
        switchMap((informeId) => {
          return this.informeService.getInforme(informeId);
        })
      )
      .subscribe((informe) => {
        this.informe = informe;
      });

    // this.themeService.themeSelected$.subscribe((theme) => (this.themeSelected = theme));
  }

  signOut() {
    this.authService.signOut();
  }
}
