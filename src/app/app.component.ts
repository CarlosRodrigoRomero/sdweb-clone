import { Component, HostBinding, OnInit } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Router } from '@angular/router';

import { ThemeService } from '@data/services/theme.service';
import { TranslateService } from '@ngx-translate/core';

// declare var gtag;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Solardrone';

  @HostBinding('class') componentCssClass: any;

  constructor(
    public overlayContainer: OverlayContainer,
    private themeService: ThemeService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.initializeTranslation();

    /*    const navEndEvents$ = this.router.events.pipe(filter((event) => event instanceof NavigationEnd));

    navEndEvents$.subscribe((event: NavigationEnd) => {
      gtag('config', 'G-76T306HFCN', {
        page_path: event.urlAfterRedirects,
        page_title: 'Web',
      });
    }); */
  }

  ngOnInit() {
    this.themeService.themeSelected$.subscribe((theme) => {
      this.overlayContainer.getContainerElement().classList.add(theme);
      this.componentCssClass = theme;

      // aplicamos el tema seleccionado
      this.themeService.applyTheme(theme);
    });
  }

  initializeTranslation() {
    // establecemos el idioma por defecto
    this.translate.setDefaultLang('es');

    // añadimos los idiomas que acepta la web
    this.translate.addLangs(['es', 'en', 'pt', 'fr']);

    // Obtén el idioma almacenado en la memoria local, si existe
    const storedLanguage = localStorage.getItem('language');

    if (storedLanguage) {
      // Usa el idioma almacenado en la memoria local
      this.translate.use(storedLanguage);
    } else {
      // Detecta el idioma del navegador
      const browserLanguage = this.translate.getBrowserLang();
      const languageToUse = browserLanguage.match(/en|es/) ? browserLanguage : 'es'; // Reemplaza con los idiomas que admitas en tu aplicación
      this.translate.use(languageToUse);

      // Almacena el idioma seleccionado en la memoria local
      localStorage.setItem('language', languageToUse);
    }
  }
}
