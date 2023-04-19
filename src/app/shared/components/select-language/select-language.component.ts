import { Component, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-select-language',
  templateUrl: './select-language.component.html',
  styleUrls: ['./select-language.component.css'],
})
export class SelectLanguageComponent implements OnInit {
  langs: string[] = [];
  languages: any = {
    en: 'English',
    es: 'Español',
    pt: 'Portugués',
    fr: 'Francés',
  };
  selectLanguage: string;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.selectLanguage = this.languages[this.translate.currentLang];
    this.langs = this.translate.getLangs();
  }

  changeLang(lang: string) {
    this.translate.use(lang);
    this.selectLanguage = this.languages[lang];

    // Almacena el idioma seleccionado en la memoria local
    localStorage.setItem('language', lang);
  }
}
