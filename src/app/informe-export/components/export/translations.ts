import en from './en.json';

export class Translation {
  public idioma: string;
  constructor(language: string) {
    this.idioma = language;
  }


  public t(text: string): string {
    if (this.idioma === 'en' ) {
      if (text in en) {
        return en[text];
      }
      return text;
    }
    return text;


  }
}
