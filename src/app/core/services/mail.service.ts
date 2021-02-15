import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MailService {
  constructor(private _http: HttpClient) {}

  sendMessage(body) {
    return this._http.post('http://localhost:3000/formulario', body);
  }
}
