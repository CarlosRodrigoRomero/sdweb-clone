import { Component, OnInit } from '@angular/core';
import {  ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit {

  public nombre: string;
  public codigo: string;
  public wistiaUrl: string;

  constructor(
    public route: ActivatedRoute,
    public sanitize: DomSanitizer
  ) { }

  ngOnInit() {
    this.route.data
    .subscribe((data: { nombre: string, codigo: string }) => {
      this.nombre = data.nombre;
      this.codigo = data.codigo;
    });


  }

  wistiaURL() {
    return this.sanitize.bypassSecurityTrustResourceUrl(`https://fast.wistia.net/embed/iframe/${this.codigo}?seo=false`);
  }

}
